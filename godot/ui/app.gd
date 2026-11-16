extends Control


func _ready() -> void:
	theme = GameTheme.get_theme()
	SceneRouter.attach(self)
	SceneRouter.go_to_select()
