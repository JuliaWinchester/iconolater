function shapeAsPoint(point) {
	// Checks if given point is a Point object, and if not returns it as Point.
	if (point instanceof Point) {
		return point;
	} else {
		return new Point(point);
	}
}

function createLabel(labelPoint, labelContent) {
	// Factory function to create label objects with associated moveable frame for word wrapping 
	this.label = new PointText({
		point: labelPoint,
		content: labelContent,
		fillColor: 'white', 
		fontFamily: 'Helvetica',
		fontSize: '20px',
		shadowColor: 'black',
		shadowBlur: 4,
		name: 'label'
	});


	this.label.box = new Path.Rectangle(label.strokeBounds);
	this.label.box.name = 'selectBox';
	this.label.box.initWidth = this.label.box.bounds.width;
	this.label.box.label = this.label;
		
	this.label.box.shiftAnchor = function(segment, delta) {
		// Provided an anchor segment and a delta point, rigidly moves anchor maintaining rectangular shape
		switch (segment.index) {
			case 0:
				var xIndex = 1;
				var yIndex = 3;
				if (segment.point.x + delta.x > this.segments[yIndex].point.x) {
					return;
				}
				break;
			case 1:
				var xIndex = 0;
				var yIndex = 2;
				if (segment.point.x + delta.x > this.segments[yIndex].point.x) {
					return;
				}
				break;
			case 2:
				var xIndex = 3;
				var yIndex = 1;
				if (segment.point.x + delta.x < this.segments[yIndex].point.x) {
					return;
				}
				break;
			case 3:
				var xIndex = 2;
				var yIndex = 0;
				if (segment.point.x + delta.x < this.segments[yIndex].point.x) {
					return;
				}
				break;
			default:
				throw new Error('Segment mismatch!');
		}
		segment.point.x = segment.point.x + delta.x;
		this.segments[xIndex].point.x = this.segments[xIndex].point.x + delta.x;

		var textTopShift = this.label.point.y - this.label.bounds.topLeft.y;
		this.label.point = this.segments[1].point.add([0,textTopShift]);
		this.label.wordWrap();

		this.segments[0].point.y = this.label.bounds.bottomLeft.y;
		this.segments[3].point.y = this.label.bounds.bottomLeft.y;

	}
	
	this.label.longestIndex = function(array) {
		var compare = 0; 
    	var longest = 0;
		for (var i = 0; i < array.length; i++) {
			if (array[i].length > compare) {
				longest = i; 
				compare = array[i].length;
			}
		}
		return longest;
	}

	this.label.wordWrap = function() {
		//label.wordwrap // A function that checks label bounding box against the selectBox and wraps words as appropriate using label.content and \n and simple rules
		// Deal with text running off bottom of square
		if (this.bounds.width > this.box.bounds.width) { 

			// store label content as an array of lines, splitting by \n
			lines = this.content.split('\n');
			longIndex = this.longestIndex(lines);
			longWords = lines[longIndex].split(" ");

			if (longWords.length > 1) {
				lines[longIndex] = longWords.slice(0, -1).join(" ");
				lines[longIndex+1] = (lines[longIndex+1] && [longWords.slice(-1), lines[longIndex+1]].join(" ")) || 
					longWords.slice(-1);
			}

			this.content = lines.join('\n');

		} else if (this.bounds.width < this.box.bounds.width) {
			lines = this.content.split('\n');
			if (this.box.initWidth < this.box.bounds.width) {
				this.content = lines.join(" ");
			}
		}
	}
		
	this.label.nearestLabelBound = function(point) {
		// Returns nearest label rectangle anchor to given point. Can be
		// used to snap a Path object to label bounding box anchor by
		// using method output as path start/end point for draw path
		// methods below.
		var point = point || [0, 0];

		point = shapeAsPoint(point);

		var b = this.bounds;

		bPoints = [b.topLeft, b.topRight, b.topCenter, 
				   b.leftCenter.subtract([5,0]), b.bottomLeft, 
				   b.bottomRight, b.bottomCenter, 
				   b.rightCenter.add([5,0])];

		bDists = bPoints.map(function(point2) {
			return point.getDistance(point2)
		});

		bDistMin = Math.min.apply(null, bDists);

		return bPoints[bDists.indexOf(bDistMin)];
	}

	return this.label;
}

function createPathGroup(start, end) {
// Factory function to plot a line Path with a second arrowhead Path at the end of the line.
// Returns a Group object containing line and arrowhead Paths. 
	var start = start || [0, 0];
	var end = end || [0, 0];

	start = shapeAsPoint(start);
	end = shapeAsPoint(end);

	var path = new Path(start, end);
	var arrowVector = end.subtract(start).normalize(10);
	var arrowPath = new Path(end.add(arrowVector.rotate(160)), end,
							 end.add(arrowVector.rotate(-160)));
	var pathGroup = new Group([path, arrowPath]);
	
	pathGroup.strokeColor = 'white';
	pathGroup.strokeWidth = 3;
	pathGroup.name = 'pathGroup';
	pathGroup.firstChild.name = 'path';
	pathGroup.lastChild.name = 'arrow';
	pathGroup.shadowColor = 'black';
	pathGroup.shadowBlur = 4;
	
	return pathGroup;
}

function labelPath(labelContent, labelPoint, pathPoint) {
// Constructor for linked paper.js text label and path objects 

	// Object scope variable so child objects can access parent methods
	var self = this;

	this.initArrowPath = function() {
	// Returns initial path with arrowhead as Group object of Path objects
		return createPathGroup(this.label.nearestLabelBound(pathPoint), 
								  	   pathPoint);
	}

	this.newArrowPath = function(start, end) {
	// Replaces previous ArrowPath with new ArrowPath using start and end points
		this.group.removeChildren(1);
		this.pathGroup = createPathGroup(start, end);
		this.group.addChild(self.pathGroup);
	}

	this.initGroup = function() {
	// Returns initial group including label PointText and path Group.
	// This group allows access to both label and path objects from UI drag 
	// methods when either label or path object are selected from UI. 
		group = new Group([this.label, this.pathGroup]);
		group.updateArrowPath = function(start, end) {
		// Allows updating of path from the group (for UI drag methods).
			self.newArrowPath(start, end);
		}
		return group;
	}

	// Constructor
	var labelPoint = labelPoint || [0, 0];
	var pathPoint = pathPoint || [0, 0];

	pathPoint = shapeAsPoint(pathPoint);

	this.label = createLabel(labelPoint, labelContent);
	this.pathGroup = this.initArrowPath();
	this.group = this.initGroup();
}

function uiDrag(tool) {
// Provides paperjs UI drag methods
	var selectBox;
	var hitOptions = {
		segments: true,
		stroke: true,
		fill: true,
		tolerance: 5
	};

	tool.onMouseDown = function(event) {
	// Sets variables based on UI item clicked
		project.activeLayer.selected = false;
		this.item = null;
		this.segment = null;

		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult)
			return;
		this.item = hitResult.item

		if (hitResult.type == 'fill') {
			this.labelPath = this.item.parent;
			this.label = this.item;
			this.pathGroup = this.labelPath.children["pathGroup"];
			this.pathEnd = this.pathGroup.children["path"].getPointAt(this.pathGroup.children["path"].length);
			this.label.box.selected = true;
		} else if (hitResult.type == 'segment' || hitResult.type == 'stroke') {
			if (this.item.name == 'selectBox') {
				this.item.selected = true;
				this.segment = hitResult.segment;
			} else {
				this.labelPath = this.item.parent.parent;
				this.label = this.labelPath.children["label"];
				this.pathGroup = this.item.parent;
				this.pathEnd = this.pathGroup.children["path"].getPointAt(this.pathGroup.children["path"].length);
				this.pathGroup.selected = true;
			}
		}
		this.mouseStart = event.point; 
	}

	tool.onMouseDrag = function(event) {
	// If Path clicked, dragging moves Path. If label PointText clicked, 
	// dragging moves label and Path.

		if (this.item instanceof Path) {
			if (this.item.name == 'selectBox') {
				this.item.shiftAnchor(this.segment, event.delta);
				this.labelPath.updateArrowPath(
							  this.label.nearestLabelBound(this.pathEnd), this.pathEnd);
			} else {
				var delta = event.point.subtract(this.mouseStart);
				var newEnd = this.pathEnd.add(delta);
				this.labelPath.updateArrowPath(
							  this.label.nearestLabelBound(newEnd), newEnd);
				this.labelPath.children["pathGroup"].selected = true;
			}
		} else if (this.item instanceof PointText) {
			this.label.position = this.label.position.add(event.delta);
			this.label.box.position = this.label.box.position.add(event.delta);
			this.labelPath.updateArrowPath(
				  this.label.nearestLabelBound(this.pathEnd), this.pathEnd);
		} else {
			this.item.position = this.item.position.add(event.delta);
		}

	}

	tool.onMouseUp = function() {
	// Unselected UI object.
		if (this.item instanceof Path && this.item.name != 'selectBox') { this.labelPath.selected = false; }
	}
}
