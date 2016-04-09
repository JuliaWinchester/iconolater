paper.install(window);
window.onload = function() {
	paper.setup('canvas');
	
	var label = new labelPath('Hello world, world hello', [100, 100], [200, 200]);
	console.log('what up');
	//console.log(label.label.bounds.width);
	//var testangle = new Path.Rectangle([50,50], [100, 100]);
	//testangle.selected = true;
}