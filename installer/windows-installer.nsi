!include "MUI2.nsh"

Name "Smart Secure Access IoT System"
OutFile "SmartSecureAccessIoTInstaller.exe"
InstallDir "$PROGRAMFILES\Smart Secure Access IoT System"

Page directory
Page instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "dist\\**"
  CreateShortCut "$DESKTOP\Smart Secure Access IoT System.lnk" "$INSTDIR\SmartSecureAccessIoTSystem.exe"
SectionEnd
