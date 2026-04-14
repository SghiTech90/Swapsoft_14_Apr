@echo off
setlocal
echo ==========================================================
echo    SMART BUDGET - CLEAN ANDROID APK GENERATOR
echo ==========================================================
echo.

:: 1. Configuration (Path to JDK)
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo [+] Using JAVA_HOME: %JAVA_HOME%
echo [+] Verifying Java Version...
java -version
if %errorlevel% neq 0 (
    echo [!] ERROR: Java not found at the specified path.
    pause
    exit /b 1
)

:: 2. Navigating to Android Folder
echo [+] Navigating to android project...
cd android

:: 3. Cleaning the Build
echo [+] Cleaning former build files...
call gradlew.bat clean
if %errorlevel% neq 0 (
    echo [!] ERROR: Gradle clean failed.
    pause
    exit /b 1
)

:: 4. Generating the Debug APK
echo [+] Generating Debug APK (app-debug.apk)...
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [!] ERROR: Debug build failed.
    pause
    exit /b 1
)

:: 5. Generating the Release APK (Unsigned/Debug-signed)
echo [+] Generating Release APK (app-release.apk)...
call gradlew.bat assembleRelease
if %errorlevel% neq 0 (
    echo [!] ERROR: Release build failed.
    pause
    exit /b 1
)

:: 6. Displaying the Output
echo.
echo ==========================================================
echo    BUILD SUCCESSFUL!
echo ==========================================================
echo.
echo Your APKs are available at:
echo Debug:   %CD%\app\build\outputs\apk\debug\app-debug.apk
echo Release: %CD%\app\build\outputs\apk\release\app-release.apk
echo.
echo Opening the APK folder...
explorer "app\build\outputs\apk"
echo ==========================================================
pause
endlocal
