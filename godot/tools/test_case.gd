extends RefCounted

var failures: Array[String] = []


func assert_eq(actual: Variant, expected: Variant) -> void:
	if typeof(actual) != typeof(expected) or actual != expected:
		failures.append("expected %s, got %s" % [str(expected), str(actual)])


func assert_ne(actual: Variant, unexpected: Variant) -> void:
	if typeof(actual) == typeof(unexpected) and actual == unexpected:
		failures.append("expected a value different from %s" % str(unexpected))


func assert_true(value: bool) -> void:
	if not value:
		failures.append("expected true")


func assert_false(value: bool) -> void:
	if value:
		failures.append("expected false")


func assert_null(value: Variant) -> void:
	if value != null:
		failures.append("expected null, got %s" % str(value))
