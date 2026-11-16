extends "res://tools/test_case.gd"


func test_assert_helpers_pass_on_true_conditions() -> void:
	assert_eq(1 + 1, 2)
	assert_ne(1, 2)
	assert_true(true)
	assert_false(false)
	assert_null(null)
