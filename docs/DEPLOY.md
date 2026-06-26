# FairFamily — 빌드 & 배포 가이드

## 사전 준비
```bash
# Gradle은 JDK 21 필요 (시스템 Java로는 실패함)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

- adb: `~/Library/Android/sdk/platform-tools/adb`
- 패키지명: `com.FairFamily.myapp`
- Firebase 프로젝트: `fairfamily-36d9b`

## 1. 웹 빌드 → 안드로이드 동기화
```bash
cd ~/fairfamily
CI=false npm run build          # React → build/
npx cap sync android            # build/ → android 프로젝트로 복사
```

## 2. 에뮬레이터/실기기 테스트 (디버그)
```bash
cd ~/fairfamily/android
./gradlew assembleDebug
ADB=~/Library/Android/sdk/platform-tools/adb
$ADB uninstall com.FairFamily.myapp   # 서명 충돌 방지: 항상 먼저 제거
$ADB install -r app/build/outputs/apk/debug/app-debug.apk
```
> 네이티브 앱은 코드 수정이 **자동 반영되지 않음** → 위 1·2 과정을 다시 거쳐야 함 (웹은 hot reload).

## 3. Play Console 업로드용 릴리스 AAB (서명됨)
1. **버전 올리기** — `android/app/build.gradle`:
   - `versionCode` 를 직전 업로드보다 **1 높게** (예: 2 → 3)
   - `versionName` 갱신 (예: "1.0.2")
2. 빌드:
```bash
cd ~/fairfamily
CI=false npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```
3. 산출물: `android/app/build/outputs/bundle/release/app-release.aab`
4. [Play Console](https://play.google.com/console) → 앱 → 프로덕션(또는 내부 테스트) → 새 버전 만들기 → 위 `.aab` 업로드 → 출시 검토 제출.

## 서명 키스토어
- 파일: `android/app/fairfamily-release3.keystore` *(android/ 는 gitignore 대상이라 git에 올라가지 않음 — 분실 주의, 별도 백업 필수!)*
- alias: `fairfamily`
- store/key password: `fairfamily2024`
- signingConfig는 `android/app/build.gradle`의 `release`에 설정되어 있어 `bundleRelease` 시 자동 서명됨.

> ⚠️ 키스토어를 잃어버리면 **같은 앱으로 업데이트를 올릴 수 없음**. 안전한 곳에 백업하세요.

## 자주 만난 이슈
- `Unsupported class file major version 70` → 시스템 Java 사용. `JAVA_HOME`을 Android Studio JDK 21로 지정.
- `INSTALL_FAILED_UPDATE_INCOMPATIBLE` → 디버그/릴리스 서명 불일치. 설치 전 `adb uninstall` 먼저.
