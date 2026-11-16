extends SceneTree

const DEFAULT_FRAMES: int = 3

var _scene_path: String = ""
var _out_path: String = ""
var _frames: int = DEFAULT_FRAMES
var _frames_seen: int = 0


func _init() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	if args.size() < 2:
		printerr("usage: capture.gd -- <scene> <out.png> [frames]")
		quit(2)
		return
	_scene_path = args[0]
	_out_path = args[1]
	if args.size() > 2:
		_frames = maxi(int(args[2]), 1)
	var packed: PackedScene = load(_scene_path) as PackedScene
	if packed == null:
		printerr("capture: cannot load scene %s" % _scene_path)
		quit(2)
		return
	root.add_child(packed.instantiate())


func _process(_delta: float) -> bool:
	_frames_seen += 1
	if _frames_seen < _frames:
		return false
	var image: Image = root.get_texture().get_image()
	var error: Error = image.save_png(_out_path)
	if error != OK:
		printerr("capture: cannot save %s (error %d)" % [_out_path, error])
		quit(1)
		return true
	print("capture: saved %s (%dx%d)" % [_out_path, image.get_width(), image.get_height()])
	quit(0)
	return true
