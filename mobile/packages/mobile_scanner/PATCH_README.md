# mobile_scanner — Local Fork Patch

This directory is a **patched local fork** of `mobile_scanner 7.4.0` from pub.dev.

## Why this fork exists

`mobile_scanner 7.4.0` ships with the following in `android/build.gradle`:

```groovy
buildscript {
    ext.kotlin_version = "2.4.10"
    dependencies {
        classpath 'com.android.tools.build:gradle:8.13.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"  // ← root cause
    }
}
```

This `buildscript {}` block places the **Kotlin Gradle Plugin (KGP) onto the global
Gradle classpath** for every subproject in the build. Android Gradle Plugin 9.x detects
this and emits the following Flutter warning — even when the plugin's own `builtInKotlin`
conditional logic skips `apply plugin: 'kotlin-android'`:

```
WARNING: Your app uses the following plugins that apply Kotlin Gradle Plugin (KGP):
- mobile_scanner
Future versions of Flutter will fail to build if your app uses plugins that apply KGP.
```

## What was changed

Only **one file** was modified: `android/build.gradle`

| Removed | Why |
|---|---|
| The entire `buildscript { }` block (lines 7–18 in the original) | Puts KGP on the global classpath, causing the AGP 9 warning |
| The `allprojects { }` block | Repository configuration is the app's responsibility, not the plugin's |

Everything else is identical to the upstream `7.4.0` release.

## How `android.builtInKotlin=true` becomes safe

With the `buildscript {}` block removed:
- No external KGP classpath is injected
- AGP 9 handles Kotlin compilation natively via built-in Kotlin
- The `mobile_scanner` conditional (`if (!builtInKotlin)`) correctly skips `apply plugin: 'kotlin-android'`
- The `kotlin { compilerOptions { jvmTarget = JVM_17 } }` block still applies via AGP's built-in Kotlin extension

## How to remove this fork (when the upstream fix is released)

1. Check `mobile_scanner` on pub.dev for a version that removes the `buildscript {}` block
2. Update `pubspec.yaml`: change `mobile_scanner: ^7.0.0` to the new version
3. Delete the `dependency_overrides` section from `pubspec.yaml`
4. Delete this entire `packages/mobile_scanner/` directory
5. Run `flutter pub get` and `flutter build apk --debug` to verify

## Reference

- Flutter built-in Kotlin migration guide:
  https://docs.flutter.dev/release/breaking-changes/migrate-to-built-in-kotlin
- mobile_scanner repository:
  https://github.com/juliansteenbakker/mobile_scanner
