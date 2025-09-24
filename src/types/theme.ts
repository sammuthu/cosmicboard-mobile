export interface ThemeColors {
  parentBackground: {
    from: string;
    via: string;
    to: string;
  };
  prismCard: {
    background: {
      from: string;
      via: string;
      to: string;
    };
    glowGradient: {
      from: string;
      via: string;
      to: string;
    };
    borderColor: string;
  };
  text: {
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
  };
  buttons: {
    primary: {
      background: string;
      hover: string;
      text: string;
    };
    secondary: {
      background: string;
      hover: string;
      text: string;
    };
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface ThemeTemplate {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isDefault: boolean;
  colors: ThemeColors;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface UserTheme {
  id?: string;
  themeId: string;
  name: string;
  displayName: string;
  colors: ThemeColors;
  isCustomized: boolean;
}

export interface UserThemeCustomization {
  id: string;
  themeId: string;
  themeName: string;
  themeDisplayName: string;
  customColors: Partial<ThemeColors>;
  isActive: boolean;
  updatedAt: string;
}