# Development Guide

Руководство по разработке библиотеки `rn-bottom-sheet` с поддержкой New Architecture.

## 📋 Предварительные требования

- Node.js 18+
- Yarn или npm
- Xcode 14+ (для iOS разработки)
- Android Studio (для Android разработки)
- JDK 17
- Ruby (для CocoaPods)

## 🚀 Быстрый старт

### 1. Установка зависимостей

В корне библиотеки:

```bash
cd rn-bottom-sheet
yarn install
```

В папке примера:

```bash
cd example
yarn install
```

### 2. Запуск Android

```bash
cd example

# Запустить Metro bundler
yarn start

# В другом терминале - собрать и запустить приложение
yarn android
```

**Важно:** Первая сборка займет 2-3 минуты из-за компиляции C++ кода Codegen и Reanimated.

### 3. Запуск iOS

```bash
cd example

# Установить pods с New Architecture
cd ios
RCT_NEW_ARCH_ENABLED=1 pod install
cd ..

# Запустить приложение
yarn ios
```

## 📁 Структура проекта

```
rn-bottom-sheet/
├── src/                          # Исходный код библиотеки
│   ├── index.tsx                 # Главный экспорт
│   ├── BottomSheet.tsx           # Основной компонент
│   └── types.ts                  # TypeScript типы
├── android/                      # Android нативный код
│   ├── build.gradle              # Gradle конфигурация
│   ├── gradle.properties         # SDK версии
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── AndroidManifestNew.xml
├── ios/                          # iOS нативный код (пока пустой)
├── example/                      # Тестовое приложение
│   ├── src/
│   │   └── App.tsx               # Демо приложение
│   ├── android/                  # Android конфигурация
│   ├── ios/                      # iOS конфигурация
│   ├── babel.config.js           # Babel с Reanimated plugin
│   ├── metro.config.js           # Metro bundler настройки
│   └── package.json
├── package.json                  # Зависимости библиотеки
├── tsconfig.json                 # TypeScript конфигурация
└── rn-bottom-sheet.podspec       # iOS CocoaPods спецификация
```

## 🛠️ Рабочий процесс разработки

### JS/TS разработка (без ребилда)

Все изменения в `src/` папке подхватываются через Fast Refresh мгновенно:

1. Откройте `src/BottomSheet.tsx`
2. Внесите изменения в логику анимаций или компонента
3. Сохраните файл (Ctrl+S / Cmd+S)
4. Изменения появятся в приложении через 1-2 секунды

### Android нативная разработка

Для изменений в Kotlin коде:

1. Откройте `rn-bottom-sheet/example/android` в Android Studio
2. Среда проиндексирует весь проект включая библиотеку
3. Внесите изменения в нативные файлы
4. Нажмите **Run** ▶️ в Android Studio
5. Благодаря кэшированию Gradle ребилд займет 10-20 секунд

**Оптимизация:** В `example/android/gradle.properties` уже настроено:
- `org.gradle.daemon=true` - Gradle демон
- `org.gradle.parallel=true` - Параллельная сборка
- `org.gradle.caching=true` - Кэширование зависимостей

### iOS нативная разработка

Для изменений в Swift коде:

1. Откройте `rn-bottom-sheet/example/ios/RnBottomSheetExample.xcworkspace` в Xcode
2. Внесите изменения в Swift файлы
3. Нажмите Run (Cmd+R)
4. Инкрементальная сборка займет несколько секунд

## 🔧 Настройка New Architecture

### Android

В `example/android/gradle.properties`:

```properties
newArchEnabled=true
hermesEnabled=true
```

### iOS

При установке pods:

```bash
RCT_NEW_ARCH_ENABLED=1 pod install
```

## 📦 Зависимости

### Основные (Peer Dependencies)

- `react-native` - платформа
- `react-native-gesture-handler` >= 2.0.0 - жесты
- `react-native-reanimated` >= 3.0.0 - анимации

### Dev Dependencies

Установлены в корневом `package.json` для разработки:
- `react-native-builder-bob` - сборка библиотеки
- TypeScript, ESLint, Prettier

## 🧪 Тестирование изменений

### Ручное тестирование

Используйте тестовое приложение в `example/`:

```bash
cd example
yarn android  # или yarn ios
```

### Тестирование в реальном приложении

Используйте локальную ссылку:

```bash
# В вашем реальном проекте
yarn add link:../rn-bottom-sheet
```

## 📝 Полезные команды

```bash
# Очистка всех build артефактов
yarn clean

# Проверка типов TypeScript
yarn typecheck

# Запуск линтера
yarn lint

# Сборка библиотеки
yarn prepare
```

## 🐛 Отладка

### Metro Bundler

```bash
cd example
yarn start --reset-cache
```

### Android

```bash
# Логи
adb logcat | grep ReactNative

# Очистка build
cd example/android
./gradlew clean
```

### iOS

```bash
# Очистка pods
cd example/ios
rm -rf Pods Podfile.lock
RCT_NEW_ARCH_ENABLED=1 pod install
```

## 📚 Полезные ссылки

- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Reanimated 3 Documentation](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/)
- [Fabric Components](https://reactnative.dev/architecture/fabric-renderer)

## 💡 Советы

1. **Быстрый цикл разработки**: Большинство изменений можно делать в JS без ребилда
2. **Android Studio**: Используйте для нативной разработки вместо CLI
3. **Кэширование**: Никогда не отключайте Gradle кэширование
4. **Fast Refresh**: Работает с Reanimated worklets
5. **TypeScript**: Строгие типы помогают избежать ошибок

## 🤝 Контрибьюция

При внесении изменений:

1. Убедитесь что `yarn typecheck` проходит
2. Проверьте `yarn lint`
3. Протестируйте на обеих платформах
4. Обновите документацию при необходимости

---

**Удачи в разработке! 🚀**
