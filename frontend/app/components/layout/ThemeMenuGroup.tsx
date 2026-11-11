"use client";

import { Menu } from "@base-ui/react/menu";
import { voice } from "@/content/voice";
import { useTheme } from "@/hooks/use-theme";
import { parseTheme, THEME_SETTINGS } from "@/lib/theme";

/**
 * Theme choice inside the account menu: a radio group whose items keep the menu open.
 */
export function ThemeMenuGroup() {
  const [setting, setTheme] = useTheme();
  return (
    <Menu.Group className="identity-group">
      <Menu.GroupLabel className="identity-group-label">{voice.theme.label}</Menu.GroupLabel>
      <Menu.RadioGroup value={setting} onValueChange={(value) => setTheme(parseTheme(value))}>
        {THEME_SETTINGS.map((option) => (
          <Menu.RadioItem
            key={option}
            value={option}
            closeOnClick={false}
            className="identity-item identity-radio"
          >
            <Menu.RadioItemIndicator className="identity-radio-dot" keepMounted />
            {voice.theme[option]}
          </Menu.RadioItem>
        ))}
      </Menu.RadioGroup>
    </Menu.Group>
  );
}
