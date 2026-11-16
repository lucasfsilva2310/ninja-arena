extends "res://tools/test_case.gd"

const Helpers: GDScript = preload("res://tests/ui_helpers.gd")
const RouterScript: GDScript = preload("res://ui/scene_router.gd")


func _router_with_host() -> Array:
	var host: Control = Control.new()
	Helpers.tree_root().add_child(host)
	var router: Node = RouterScript.new()
	router.attach(host)
	return [router, host]


func _cleanup(router: Node, host: Control) -> void:
	router.free()
	Helpers.unmount(host)


func test_router_shows_select_screen_in_the_host() -> void:
	var pair: Array = _router_with_host()
	var router: Node = pair[0]
	var host: Control = pair[1]
	router.go_to_select()
	assert_eq(host.get_child_count(), 1)
	assert_true(host.get_child(0) is CharacterSelect)
	_cleanup(router, host)


func test_router_switches_to_battle_with_the_chosen_team() -> void:
	var pair: Array = _router_with_host()
	var router: Node = pair[0]
	var host: Control = pair[1]
	router.go_to_select()
	var screen: CharacterSelect = host.get_child(0) as CharacterSelect
	for card: CharacterCard in screen.cards:
		if card.character.display_name != "Sasuke":
			screen.toggle_character(card.character)
	screen.start()
	var view: BattleView = router.current as BattleView
	assert_true(view != null)
	assert_eq(router.chosen_team.size(), 3)
	var names: Array[String] = []
	for fighter: Fighter in view.battle.teams[0].fighters:
		names.append(fighter.display_name())
	assert_eq(names, ["Naruto", "Sakura", "Rock Lee"] as Array[String])
	assert_eq(view.battle.teams[1].fighters[0].display_name(), "Naruto")
	assert_eq(view.panels.size(), 6)
	_cleanup(router, host)


func test_router_without_a_host_does_not_crash() -> void:
	var router: Node = RouterScript.new()
	router.go_to_select()
	assert_null(router.current)
	router.free()
