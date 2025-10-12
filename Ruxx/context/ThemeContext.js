import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeWindStyleSheet } from "nativewind";
import { Appearance } from "react-native";

const ThemeContext = createContext();



 

const lightTheme = {
  background: "#f5f5f5",
  text: "#000000",
  card: "#f5f5f5",
  border: "#000000",
  inputBackground: "#ffffff",
  inputText: "#000000",
  placeholder: "#888888",
  gray: "#e0e0e0",
  selectedBackground: "#000000",
  selectedText: "#ffffff",
  buttonBackground: "#000",
  buttonText: "#ffffff",
  modalOverlay: "rgba(0,0,0,0.3)",
  label: "#333333",
  accent: "#000",
  danger: "#FF3B30",
  icon: "#000",
  airtime: "#000",
  fundbg: "#fff",
  ftext: "#000",
  ttext: "#fff",
  itext: "#fff",
  scard: "#f0f0f0",
  subtitle: "#555",
  primary: "#000",
  secondary: "#555",
  shadow: "#000",
  chipBg:  '#e0e0e0',
  chipText: '#000',
  chipSelectedBg: '#0f9d58',
  chipSelectedText: '#fff', 
  modalBg: '#fff', 
  modalOverlay: 'rgba(0,0,0,0.5)',
  pageBg: '#f9fafb',
  sectionBg: '#fff',
  inputBorder: '#d1d5db',
  buttonBg: '#4ADE80',
  alertText: '#111',
  cardBackground: '#f5f5f5',
};

const darkTheme = {
  background: "#121212",
  text: "#ffffff",
  card: "#1e1e1e",
  border: "#ffffff",
  inputBackground: "#1a1a1a",
  inputText: "#ffffff",
  placeholder: "#aaaaaa",
  gray: "#333333",
  selectedBackground: "#1e88e5",
  selectedText: "#ffffff",
  buttonBackground: "#333",
  buttonText: "#ffffff",
  modalOverlay: "rgba(255,255,255,0.2)",
  label: "#bbbbbb",
  accent: "#333",
  danger: "#FF453A",
  icon: "#fff",
  airtime: "#fff",
  fundbg: "#fff",
  ftext: "#000",
  ttext: "#fff",
  itext: "#fff",
  scard: "#1e1e1e",
  subtitle: "#aaa",
  primary: "#4ADE80", // maybe a nice green accent for buttons
  secondary: "#333",
  shadow: "#000",
  chipBg: '#1e1e1e',
  chipText: '#fff',
  chipSelectedBg: '#0f9d58',
  chipSelectedText: '#fff',
  modalBg: '#1e1e1e',
  modalOverlay: 'rgba(0,0,0,0.5)',
  pageBg:  '#000',
  sectionBg: '#111',
  inputBorder: '#555',
  buttonBg: '#fff',
  alertText: '#111',
  cardBackground: '#1e1e1e',
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState("light"); // light | dark | system

  const getTheme = () => {
    if (mode === "system") {
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === "dark" ? darkTheme : lightTheme;
    }
    return mode === "dark" ? darkTheme : lightTheme;
  };

  const theme = useMemo(() => getTheme(), [mode]);

  const applyNativeWindTheme = (activeMode) => {
    const resolvedMode =
      activeMode === "system" ? Appearance.getColorScheme() : activeMode;
    NativeWindStyleSheet.setColorScheme(resolvedMode || "light");
  };

  const loadTheme = async () => {
    const savedMode = await AsyncStorage.getItem("themeMode");
    const initialMode = savedMode || "system";
    setMode(initialMode);
    applyNativeWindTheme(initialMode);
  };

  useEffect(() => {
    loadTheme();
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === "system") {
        applyNativeWindTheme("system");
      }
    });
    return () => listener.remove();
  }, []);

  useEffect(() => {
    applyNativeWindTheme(mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
