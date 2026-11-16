class_name GameTheme
extends RefCounted

const FONT_PATH: String = "res://assets/fonts/mangat.ttf"
const FONT_BOLD_PATH: String = "res://assets/fonts/mangatb.ttf"

const INK: Color = Color("1e293b")
const PARCHMENT: Color = Color(0.9, 0.84, 0.76, 0.93)
const PARCHMENT_EDGE: Color = Color("8b7355")
const SELECTED: Color = Color("3b82f6")

static var _cached: Theme = null


static func get_theme() -> Theme:
	if _cached == null:
		_cached = _build()
	return _cached


static func box(fill: Color, border: Color = Color(0, 0, 0, 0), border_width: int = 0, radius: int = 8, padding: int = 8) -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = fill
	style.border_color = border
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(radius)
	style.set_content_margin_all(padding)
	return style


static func _button_styles(theme: Theme, type_name: String, base: Color, base_type: String = "Button") -> void:
	if type_name != base_type:
		theme.set_type_variation(type_name, base_type)
	theme.set_stylebox("normal", type_name, box(base, base.darkened(0.4), 2, 8, 8))
	theme.set_stylebox("hover", type_name, box(base.lightened(0.15), base.darkened(0.4), 2, 8, 8))
	theme.set_stylebox("pressed", type_name, box(base.darkened(0.15), base.darkened(0.5), 2, 8, 8))
	theme.set_stylebox("focus", type_name, box(Color(0, 0, 0, 0), SELECTED, 2, 8, 8))
	theme.set_stylebox("disabled", type_name, box(Color("94a3b8"), Color("64748b"), 2, 8, 8))
	theme.set_color("font_color", type_name, Color.WHITE)
	theme.set_color("font_hover_color", type_name, Color.WHITE)
	theme.set_color("font_pressed_color", type_name, Color.WHITE)
	theme.set_color("font_disabled_color", type_name, Color(1, 1, 1, 0.85))


static func _build() -> Theme:
	var theme: Theme = Theme.new()
	var font: FontFile = load(FONT_PATH) as FontFile
	var bold: FontFile = load(FONT_BOLD_PATH) as FontFile
	theme.default_font = font
	theme.default_font_size = 16

	theme.set_color("font_color", "Label", INK)
	theme.set_type_variation("LightLabel", "Label")
	theme.set_color("font_color", "LightLabel", Color.WHITE)
	theme.set_color("font_outline_color", "LightLabel", Color.BLACK)
	theme.set_constant("outline_size", "LightLabel", 4)
	theme.set_type_variation("TitleLabel", "Label")
	theme.set_font("font", "TitleLabel", bold)
	theme.set_font_size("font_size", "TitleLabel", 20)
	theme.set_type_variation("SmallLabel", "Label")
	theme.set_font_size("font_size", "SmallLabel", 13)

	theme.set_stylebox("panel", "PanelContainer", box(PARCHMENT, PARCHMENT_EDGE, 2, 10, 10))
	theme.set_type_variation("DarkPanel", "PanelContainer")
	theme.set_stylebox("panel", "DarkPanel", box(Color(0.05, 0.07, 0.12, 0.62), Color(1, 1, 1, 0.25), 1, 10, 8))
	theme.set_type_variation("ChipPanel", "PanelContainer")
	theme.set_stylebox("panel", "ChipPanel", box(Color("dbeafe"), Color("3b82f6"), 1, 6, 3))

	_button_styles(theme, "Button", PARCHMENT_EDGE)
	_button_styles(theme, "StartButton", Color("10b981"))
	_button_styles(theme, "EndTurnButton", Color("be2214"))

	theme.set_type_variation("AbilityButton", "Button")
	theme.set_stylebox("normal", "AbilityButton", box(Color(0, 0, 0, 0), Color.BLACK, 2, 6, 0))
	theme.set_stylebox("hover", "AbilityButton", box(Color(1, 1, 1, 0.15), Color("fbbf24"), 3, 6, 0))
	theme.set_stylebox("pressed", "AbilityButton", box(Color(0, 0, 0, 0.2), Color("fbbf24"), 3, 6, 0))
	theme.set_stylebox("focus", "AbilityButton", box(Color(0, 0, 0, 0), Color("fbbf24"), 3, 6, 0))
	theme.set_stylebox("disabled", "AbilityButton", box(Color(0, 0, 0, 0.45), Color(0.2, 0.2, 0.2), 2, 6, 0))
	theme.set_color("icon_disabled_color", "AbilityButton", Color(0.45, 0.45, 0.45, 1))

	theme.set_stylebox("background", "ProgressBar", box(Color(0.12, 0.12, 0.14), Color.BLACK, 1, 4, 2))
	theme.set_stylebox("fill", "ProgressBar", box(Color("22c55e"), Color(0, 0, 0, 0), 0, 3, 2))
	theme.set_type_variation("HpBar", "ProgressBar")
	theme.set_type_variation("DeadHpBar", "ProgressBar")
	theme.set_stylebox("fill", "DeadHpBar", box(Color("64748b"), Color(0, 0, 0, 0), 0, 3, 2))
	return theme
