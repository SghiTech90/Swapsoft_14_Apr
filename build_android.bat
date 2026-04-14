@echo off
SET JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
echo Using JAVA_HOME: %JAVA_HOME%
cd android
call gradlew.bat clean
cd ..
npx react-native run-android --verbose
