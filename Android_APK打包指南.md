# 成本计算工具 - Android APK 打包全流程指南

> 适用对象：成本计算工具（Capacitor + 原生 HTML/JS 前端）
> 适用平台：Windows 10/11 (PowerShell 5+)
> 项目位置：`D:\Mycode\Cost\Cost`
> 文档版本：v1.0（2026-06-12）

---

## 1. 项目概览

| 项目项 | 说明 |
|---|---|
| 应用名称 | 成本计算工具 |
| 包名 | `com.costcalc.app` |
| 应用ID | `com.costcalc.app` |
| 架构 | Capacitor 6 + Android Gradle Plugin 8.13.0 |
| 前端技术 | 原生 HTML/CSS/JavaScript（无构建工具） |
| 数据存储 | localStorage（纯前端，无需后端服务） |
| minSdk | 24（兼容 Android 7.0+） |
| targetSdk / compileSdk | 36（Android 15 Preview） |
| 版本 | versionCode: 1, versionName: 1.0 |

**项目目录结构：**

```
D:\Mycode\Cost\Cost\
├── frontend/              ← 前端源码（HTML/CSS/JS）
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── api.js         ← 双模式 API（LOCAL/REMOTE）
│       ├── app.js
│       └── modules/       ← 业务模块（商品/原料/规则/计算/历史/导航）
├── android/               ← Capacitor 生成的 Android 工程（核心）
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/AndroidManifest.xml
│   ├── build.gradle       ← AGP 版本声明
│   ├── variables.gradle   ← minSdk/compileSdk/targetSdk 等
│   ├── local.properties   ← **关键**：Android SDK 路径（本机私有）
│   ├── gradle.properties  ← **关键**：指定 JDK 21 路径
│   ├── gradle/wrapper/gradle-wrapper.properties  ← Gradle 版本声明
│   ├── gradlew
│   └── gradlew.bat        ← Windows 构建入口
├── capacitor.config.json  ← Capacitor 配置（应用名/包名/前端目录）
├── package.json           ← Node.js 依赖 + npm scripts
└── node_modules/          ← Capacitor CLI 依赖（首次需 npm install）
```

---

## 2. 环境准备（一次性工作）

### 2.1 需要的工具

| 工具 | 版本要求 | 用途 |
|---|---|---|
| **Java JDK** | **21**（硬性要求）| Gradle/AGP 8.13+ 用 JDK 21 编译 |
| **Android SDK** | Platform 36 + Build-Tools 35+ | 编译 Android 资源/Dalvik 字节码 |
| **Node.js** | 18+（推荐 20+）| 执行 `npx cap` 同步前端代码 |
| **Android Studio**（可选）| Hedgehog 或更新 | 可视化管理 SDK、安装平台工具 |

---

### 2.2 安装 JDK 21

**推荐：用 IDEA 下载 Microsoft OpenJDK 21**（最简单）

```
IDEA → File → Project Structure → Platform Settings → SDKs
→ 点击 "+" → Download JDK
→ Vendor: Microsoft
→ Version: 21
→ Location: 保持默认（通常是 C:\Users\用户名\.jdks\ms-21.0.9）
→ 下载完成后记下路径
```

或用命令行（PowerShell）：

```powershell
winget install Microsoft.OpenJDK.21
```

**安装位置确认**：执行后，记下 JDK 根目录（例如 `C:\Users\linge\.jdks\ms-21.0.9`）。

**验证 JDK 完整性**（重要，AGP 要用到 jlink.exe）：

```powershell
# 应该返回 True
Test-Path "C:\Users\linge\.jdks\ms-21.0.9\bin\jlink.exe"
Test-Path "C:\Users\linge\.jdks\ms-21.0.9\bin\javac.exe"

# 输出 21.x.x
& "C:\Users\linge\.jdks\ms-21.0.9\bin\java.exe" -version
```

---

### 2.3 安装 Android SDK

如果已安装 Android Studio，它通常已经把 SDK 装到以下两个位置之一：

```
C:\Users\用户名\AppData\Local\Android\Sdk   ← Android Studio 默认
D:\Android\AndroidSDK                        ← 或自定义位置
```

**确认 SDK 内容**：该目录下必须存在 `build-tools/`、`platforms/`、`platform-tools/` 三个子目录。

在 Android Studio 里安装 SDK Platform 36 和 Build-Tools 35：

```
Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
→ SDK Platforms 标签 → 勾选 "Android 15 Preview"（对应 API 36）→ Apply
→ SDK Tools 标签 → 勾选 "Android SDK Build-Tools 35" → Apply
```

> 💡 如果不使用 Android Studio，也可以通过 `sdkmanager` 命令行安装，但需要先下载 [Android Command Line Tools](https://developer.android.com/studio#command-tools)。

---

### 2.4 安装 Node.js（已装可跳过）

```powershell
node --version   # 应输出 v18 或更高
npm --version    # 应输出 9+
```

若未安装，从 [nodejs.org](https://nodejs.org/) 下载 LTS 版（Windows x64 MSI），默认安装即可。

---

## 3. 工程配置（已完成者可跳过）

### 3.1 `android/local.properties`（必须存在，每台机器不同）

在 `D:\Mycode\Cost\Cost\android\local.properties` 写入：

```properties
# Android SDK 路径（Windows 用双反斜杠 \\，或正斜杠 /）
sdk.dir=D:\\Android\\AndroidSDK

# 可选：ndk.dir（本项目不需要 NDK）
```

**⚠️ 坑点**：路径分隔符必须用 `\\`（双反斜杠），否则 `.properties` 文件会把 `\A` 当成转义字符吞掉，引发 "文件名/目录名或卷标语法不正确"。

---

### 3.2 `android/gradle.properties`（必须存在，每台机器不同）

在 `D:\Mycode\Cost\Cost\android\gradle.properties` 末尾添加：

```properties
# 强制 Gradle 使用 JDK 21（写你本机的实际路径，双反斜杠）
org.gradle.java.home=C:\\Users\\linge\\.jdks\\ms-21.0.9

# （可选）打开 AndroidX 兼容与内存配置
android.useAndroidX=true
android.nonTransitiveRClass=true
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.daemon=true
```

**验证**：改完后执行 `gradlew.bat --stop` 杀掉旧 daemon，确保下次启动用新 JDK。

---

### 3.3 `capacitor.config.json`（通常无需修改）

位于项目根目录，内容示例：

```json
{
  "appId": "com.costcalc.app",
  "appName": "成本计算工具",
  "webDir": "frontend",
  "server": {
    "androidScheme": "https"
  }
}
```

`webDir` 指向 `frontend/`，Capacitor 会把它打包进 Android 的 `assets/public/`。

---

## 4. 安装 Node 依赖（首次/更新后）

```powershell
cd D:\Mycode\Cost\Cost

# 如果 node_modules/ 不存在或需要更新
npm install

# 若提示 electron_mirror 是未知配置属正常警告，不影响打包
```

---

## 5. 构建 Debug 版 APK（日常开发用）

### 步骤 5.1：同步前端代码到 Android 工程

每次修改 `frontend/` 目录后，**必须执行**：

```powershell
cd D:\Mycode\Cost\Cost
npx cap copy android
```

**输出应包含**：

```
✔ Copying web assets from frontend to android/app/src/main/assets/public in ...
✔ Copying native bridge...
✔ Copying capacitor.config.json...
✔ copy in ...ms
```

> 这条命令会把 `frontend/` 下所有文件复制到 `android/app/src/main/assets/public/`，Android APP 启动时会加载该目录的 `index.html`。

---

### 步骤 5.2：杀掉旧 Gradle Daemon（确保用 JDK 21）

```powershell
cd D:\Mycode\Cost\Cost\android
.\gradlew.bat --stop
```

---

### 步骤 5.3：构建 APK

```powershell
cd D:\Mycode\Cost\Cost\android
.\gradlew.bat assembleDebug
```

**首次构建会自动下载**：
- Gradle 8.14.3 发行包（~200MB）
- AGP 8.13.0 的 Maven 依赖
- AndroidX 核心库（appcompat / webkit 等）
- 首次约 **2-5 分钟**，后续增量构建只需 10-30 秒

**构建成功标志**：

```
BUILD SUCCESSFUL in Xm Ys
93 actionable tasks: 58 executed, 35 up-to-date
```

**产物路径**：

```
D:\Mycode\Cost\Cost\android\app\build\outputs\apk\debug\app-debug.apk
```

查看产物大小：

```powershell
$apk = "D:\Mycode\Cost\Cost\android\app\build\outputs\apk\debug\app-debug.apk"
$size = [math]::Round((Get-Item $apk).Length / 1MB, 2)
Write-Host "APK: $apk"
Write-Host "大小: $size MB"
```

**典型大小**：约 20-35 MB（主要是 Capacitor WebView 引擎 + 你的前端代码）。

---

### 步骤 5.4：安装到手机

#### 方式 A：USB 连接 + adb（推荐）

```powershell
# 1. 手机开启"开发者模式/USB 调试"并通过数据线连接电脑
# 2. 验证设备
& "D:\Android\AndroidSDK\platform-tools\adb.exe" devices

# 3. 安装 APK（-r = 覆盖已安装版本）
& "D:\Android\AndroidSDK\platform-tools\adb.exe" install -r "D:\Mycode\Cost\Cost\android\app\build\outputs\apk\debug\app-debug.apk"
```

#### 方式 B：文件传输

把 `app-debug.apk` 通过微信/QQ/USB 传到手机，在文件管理器中点开安装。首次安装会提示"允许未知来源"，授权后即可。

#### 方式 C：Android Studio Run

在 IDEA / Android Studio 中打开 android 目录，顶部工具栏选 `app` 模块 + 你的手机设备 → 点击绿色 ▶️ Run 按钮。

---

## 6. 构建 Release 版 APK（对外分发）

Debug 版使用 debug keystore 签名，体积较大，且 Android 系统会标记为"调试版本"。发布给他人时建议用 release 版。

### 6.1 确认应用名称与图标

修改 `android/app/src/main/res/values/strings.xml`：

```xml
<resources>
    <string name="app_name">成本计算工具</string>
    <string name="title_activity_main">成本计算工具</string>
</resources>
```

图标放在 `android/app/src/main/res/mipmap-*/`。如需自定义图标，用 IDEA 的 Image Asset Studio 生成。

### 6.2 用 Debug Keystore 快速签名（测试用）

在 `android/app/build.gradle` 末尾（`buildTypes{}` 块中）加入：

```gradle
buildTypes {
    release {
        minifyEnabled false
        signingConfig signingConfigs.debug   ← 此行
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

然后执行：

```powershell
cd D:\Mycode\Cost\Cost\android
.\gradlew.bat --stop
.\gradlew.bat assembleRelease
```

产物：`android/app/build/outputs/apk/release/app-release.apk`

### 6.3 用自定义 Keystore 正式签名（正式发布）

如果你要发布到应用商店或做正式分发：

1. 生成 keystore（只需做一次）：

```powershell
keytool -genkey -v -keystore costcalc-release.jks -keyalg RSA -keysize 2048 -validity 36500 -alias costcalc
```

按提示输入 storepassword / keypass / 组织信息。完成后得到 `costcalc-release.jks`。

2. 在 `android/app/build.gradle` 配置 signingConfigs：

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("D:/costcalc-release.jks")   // keystore 路径
            storePassword "你的密码"
            keyAlias "costcalc"
            keyPassword "你的密码"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            shrinkResources false
        }
    }
}
```

3. 执行 `.\gradlew.bat assembleRelease`。

4. 将 `costcalc-release.jks` 和密码单独保存，不要提交到 Git。

---

## 7. 一键打包脚本

把以下内容保存为 `D:\Mycode\Cost\Cost\build-apk.ps1`，以后双击即可完成"同步前端 → 构建 APK"流程：

```powershell
# 成本计算工具 - Android APK 一键打包脚本
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $ProjectRoot "frontend"
$AndroidDir = Join-Path $ProjectRoot "android"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " 成本计算工具 - Android APK 一键打包" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "项目目录: $ProjectRoot"
Write-Host ""

# Step 1: 同步前端
Write-Host "[1/3] 同步前端代码到 Android 工程..." -ForegroundColor Yellow
Set-Location $ProjectRoot
npx cap copy android
if ($LASTEXITCODE -ne 0) { throw "cap copy 失败，检查 Node.js 是否已安装" }
Write-Host "✅ 前端同步完成" -ForegroundColor Green

# Step 2: 杀掉旧 Gradle daemon（避免用旧 JDK）
Write-Host "[2/3] 清理旧 Gradle 守护进程..." -ForegroundColor Yellow
Set-Location $AndroidDir
.\gradlew.bat --stop | Out-Null
Write-Host "✅ Daemon 已停止" -ForegroundColor Green

# Step 3: 构建 Debug APK
Write-Host "[3/3] 构建 Debug APK (首次需下载依赖，约数分钟)..." -ForegroundColor Yellow
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { throw "Gradle 构建失败，请查看上方错误日志" }

# 完成
$APK = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
$SizeMB = [math]::Round((Get-Item $APK).Length / 1MB, 2)

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "✅ APK 构建完成!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "文件: $APK"
Write-Host "大小: $SizeMB MB"
Write-Host ""
Write-Host "安装命令:"
Write-Host "  & `"D:\Android\AndroidSDK\platform-tools\adb.exe`" install -r `"$APK`""
Write-Host ""
Write-Host "把 APK 传到手机后点击安装即可。"
```

**使用**：在 `D:\Mycode\Cost\Cost\` 目录，PowerShell 中运行：

```powershell
.\build-apk.ps1
```

---

## 8. 常见问题排查

按出现频率排序：

---

### 问题 1：`java.io.IOException: 文件名、目录名或卷标语法不正确。`

**原因**：`local.properties` 中 `sdk.dir` 用了单反斜杠。

**修复**：
```properties
sdk.dir=D:\\Android\\AndroidSDK   # 正确（双反斜杠）
# 或
sdk.dir=D:/Android/AndroidSDK     # 正确（正斜杠）
# 错误：sdk.dir=D:\Android\AndroidSDK
```

---

### 问题 2：`错误: 无效的源发行版：21`

**原因**：Gradle 试图用 JDK 17（或更低）编译 Java 21 源码。

**修复**：在 `android/gradle.properties` 中加入：
```properties
org.gradle.java.home=C:\\Users\\linge\\.jdks\\ms-21.0.9   ← 改成你本机 JDK 21 路径
```
然后执行 `.\gradlew.bat --stop` 杀掉旧 daemon，重新构建。

---

### 问题 3：`SDK location not found. Define sdk.dir in local.properties`

**原因**：`android/local.properties` 不存在或路径错误。

**修复**：按 3.1 节创建 `local.properties`，写入正确的 `sdk.dir`。

---

### 问题 4：`License for package Android SDK Build-Tools 35 not accepted`

**原因**：首次使用 Build-Tools 35 需要接受许可。

**修复**：在 Android Studio SDK Manager 中勾选对应组件后 Apply，或命令行执行：
```powershell
& "D:\Android\AndroidSDK\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
# 反复输入 y 并回车，直到所有 license 被接受
```

---

### 问题 5：`Could not resolve com.android.tools.build:gradle:8.13.0`

**原因**：网络无法访问 Google Maven（常见于中国大陆）。

**修复**：在 `android/build.gradle` 和 `android/settings.gradle` 的 `repositories{}` 中，把 `google()` 和 `mavenCentral()` 替换为国内镜像：

```gradle
repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
}
```

注意：`dependencyResolutionManagement`（settings.gradle 中的 repositoriesMode）需要同步配置。

---

### 问题 6：构建成功但 APP 打开白屏/加载失败

**可能原因 1**：`cap copy` 未执行，前端代码没打包进 assets。
- 执行 `npx cap copy android` 后重新 `assembleDebug`

**可能原因 2**：前端引用了不存在的文件（如 images/ 目录为空）
- 检查 `frontend/` 目录下的资源是否存在（尤其是 images/ 目录）

**可能原因 3**：前端 `api.js` 默认是 REMOTE 模式但无后端服务
- 确认 `frontend/js/api.js` 中有 `if (window.__API_MODE__ !== 'REMOTE') return 'LOCAL'` 的判断，默认为 LOCAL

---

### 问题 7：安装到手机后闪退

常见原因：
- 手机 Android 版本 < 7.0（低于 minSdk=24）
- WebView 组件异常（部分老手机需要在应用商店更新 Android System WebView）
- 前端脚本有语法错误且 WebView 版本不支持新语法（建议避免用 ES2022+ 新特性，或用 Babel 降级）

调试方法：USB 连接手机后在 Android Studio Logcat 中筛选 `System.err`、`chromium`、`SystemWebView` 查看异常堆栈。

---

### 问题 8：WARNING: Using flatDir should be avoided

这是警告非错误。Capacitor Cordova 插件目录使用 `flatDir` 来解析本地 AAR/JAR。不会影响 APK 生成，可忽略。

---

## 9. 版本发布清单

每次发布新版 APK 前，请完成以下检查：

- [ ] 更新 `android/app/build.gradle` 中的 `versionCode`（+1）和 `versionName`（如 "1.1"）
- [ ] 同步前端代码（`npx cap copy android`）
- [ ] 清理历史产物：`.\gradlew.bat clean`
- [ ] 构建 release 版：`.\gradlew.bat assembleRelease`
- [ ] 在至少一台真机上安装并验证核心功能（商品/规则/计算/历史）
- [ ] 更新 Changelog（建议在项目根目录放 CHANGELOG.md）

---

## 10. 快捷命令速查

| 命令 | 用途 | 执行位置 |
|---|---|---|
| `npx cap copy android` | 同步前端到 Android 工程 | `D:\Mycode\Cost\Cost` |
| `.\gradlew.bat --stop` | 杀掉 Gradle daemon | `android\` |
| `.\gradlew.bat --version` | 查看 Gradle/JDK 版本 | `android\` |
| `.\gradlew.bat assembleDebug` | 构建 debug APK | `android\` |
| `.\gradlew.bat assembleRelease` | 构建 release APK | `android\` |
| `.\gradlew.bat clean` | 清理 build 目录（慢构建时用） | `android\` |
| `adb install -r app-debug.apk` | 安装到手机 | 任何目录 |
| `adb logcat -s chromium:* System.err:*` | 查看 APP 运行日志（调试白屏/闪退） | 任何目录 |

---

## 11. 相关文件路径速查

| 配置项 | 路径（相对于 `D:\Mycode\Cost\Cost\`） |
|---|---|
| 前端代码 | `frontend/` |
| Capacitor 配置 | `capacitor.config.json` |
| Android SDK 路径 | `android/local.properties`（`sdk.dir`）|
| JDK 路径（给 Gradle）| `android/gradle.properties`（`org.gradle.java.home`）|
| Gradle 版本 | `android/gradle/wrapper/gradle-wrapper.properties` |
| AGP 版本 | `android/build.gradle`（`com.android.tools.build:gradle:8.13.0`）|
| SDK 版本约束 | `android/variables.gradle`（minSdk/compileSdk/targetSdk）|
| 包名/版本号 | `android/app/build.gradle`（applicationId / versionCode / versionName）|
| 应用名称 | `android/app/src/main/res/values/strings.xml`（`app_name`）|
| Debug APK 产物 | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Release APK 产物 | `android/app/build/outputs/apk/release/app-release.apk` |

---

**最后更新**：2026-06-12
**维护者**：本项目开发团队
**适用版本**：成本计算工具 v1.0（Capacitor 6 + AGP 8.13.0 + Gradle 8.14.3）
