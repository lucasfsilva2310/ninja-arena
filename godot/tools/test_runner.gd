extends SceneTree

const TESTS_DIR: String = "res://tests"
const TestCaseScript: GDScript = preload("res://tools/test_case.gd")

var _failures: int = 0
var _passed: int = 0
var _started: bool = false


func _process(_delta: float) -> bool:
	if _started:
		return true
	_started = true
	_run_all()
	return true


func _run_all() -> void:
	var files: Array[String] = _find_test_files()
	for path: String in files:
		_run_file(path)
	print("")
	print("Tests: %d passed, %d failed" % [_passed, _failures])
	quit(1 if _failures > 0 else 0)


func _find_test_files() -> Array[String]:
	var result: Array[String] = []
	var dir: DirAccess = DirAccess.open(TESTS_DIR)
	if dir == null:
		return result
	for file: String in dir.get_files():
		if file.begins_with("test_") and file.ends_with(".gd"):
			result.append(TESTS_DIR + "/" + file)
	result.sort()
	return result


func _run_file(path: String) -> void:
	var script: GDScript = load(path) as GDScript
	if script == null or not script.can_instantiate():
		_failures += 1
		print("FAIL  %s: cannot load script" % path)
		return
	var methods: Array[String] = []
	for info: Dictionary in script.get_script_method_list():
		var method_name: String = info["name"]
		if method_name.begins_with("test_"):
			methods.append(method_name)
	methods.sort()
	for method_name: String in methods:
		var instance: RefCounted = script.new() as RefCounted
		if instance == null or instance.get_script() == null or not _is_test_case(script):
			_failures += 1
			print("FAIL  %s: test script must extend res://tools/test_case.gd" % path)
			return
		instance.call(method_name)
		var failures: Array[String] = []
		failures.assign(instance.get("failures"))
		var label: String = "%s::%s" % [path.get_file(), method_name]
		if failures.is_empty():
			_passed += 1
			print("PASS  %s" % label)
		else:
			_failures += 1
			for message: String in failures:
				print("FAIL  %s: %s" % [label, message])


func _is_test_case(script: GDScript) -> bool:
	var current: Script = script
	while current != null:
		if current == TestCaseScript:
			return true
		current = current.get_base_script()
	return false
