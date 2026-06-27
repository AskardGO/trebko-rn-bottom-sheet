# Инструкция по настройке среды разработки

Полное пошаговое руководство по развертыванию окружения для разработки библиотеки `rn-bottom-sheet` с New Architecture.

## 📥 Шаг 1: Установка зависимостей

### Корень библиотеки

```bash
cd rn-bottom-sheet
yarn install
```

Это установит:
- `react-native-reanimated` (dev)
- `react-native-gesture-handler` (dev)
- `react-native-builder-bob`
- TypeScript и линтеры

### Пример приложения

```bash
cd example
yarn install
```

Это установит:
- React Native 0.74
- Reanimated 3
- Gesture Handler 2
- Локальную ссылку на библиотеку

## 🤖 Шаг 2: Настройка Android

### 2.1. Проверка gradle.properties

Файл `example/android/gradle.properties` уже содержит:

```properties
# New Architecture включена
newArchEnabled=true

# Hermes JS engine
hermesEnabled=true

# Оптимизация сборки
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.caching=true
```

### 2.2. Первая сборка

```bash
cd example
yarn android
```

**Ожидаемое время:** 2-3 минуты (первый раз)
**Последующие сборки:** 10-30 секунд

### 2.3. Открытие в Android Studio

Для удобной разработки:

```bash
cd example/android
# Откройте эту папку в Android Studio
```

## 🍎 Шаг 3: Настройка iOS

### 3.1. Установка CocoaPods

```bash
# Если еще не установлен
sudo gem install cocoapods
```

### 3.2. Установка зависимостей с New Architecture

```bash
cd example/ios
RCT_NEW_ARCH_ENABLED=1 pod install
```

**Важно:** Флаг `RCT_NEW_ARCH_ENABLED=1` обязателен!

### 3.3. Первый запуск

```bash
cd ..  # Вернуться в example/
yarn ios
```

**Ожидаемое время:** 3-5 минут (первый раз)

## ⚙️ Шаг 4: Проверка конфигурации

### Babel

Файл `example/babel.config.js` должен иметь:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.tsx', '.ts', '.js', '.json'],
        alias: {
          'rn-bottom-sheet': '../src/index',
        },
      },
    ],
    'react-native-reanimated/plugin', // ВАЖНО: Должен быть последним!
  ],
};
```

### Metro

Файл `example/metro.config.js` настроен для работы с монорепозиторием:

```javascript
const config = {
  watchFolders: [root],  // Следит за изменениями в корне библиотеки
  resolver: {
    extraNodeModules: // Корректное разрешение peer dependencies
  }
};
```

## ✅ Шаг 5: Проверка работы

### Запуск приложения

Терминал 1 - Metro:
```bash
cd example
yarn start
```

Терминал 2 - Android:
```bash
cd example
yarn android
```

Терминал 3 - iOS:
```bash
cd example
yarn ios
```

### Проверка функционала

В запущенном приложении вы должны увидеть:
1. Кнопку "Open Bottom Sheet"
2. Кнопки управления (Expand, Collapse, Close)
3. При нажатии открывается Bottom Sheet с плавной анимацией
4. Свайп вниз закрывает Sheet
5. Backdrop затемняет фон

## 🔥 Шаг 6: Проверка Fast Refresh

1. Откройте `src/BottomSheet.tsx`
2. Измените стиль (например, `borderTopLeftRadius: 24` → `borderTopLeftRadius: 32`)
3. Сохраните файл
4. Изменение должно появиться в приложении через 1-2 секунды БЕЗ перезапуска

## 🛠️ Шаг 7: Настройка IDE

### VS Code

Рекомендуемые расширения:
- ESLint
- Prettier
- React Native Tools
- TypeScript

Настройки `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Android Studio

1. Откройте `example/android`
2. Дождитесь индексации (может занять 2-3 минуты)
3. File → Project Structure → проверьте JDK 17

## 🚨 Решение проблем

### Проблема: Gradle долго собирается

**Решение:**
```bash
# Проверьте gradle.properties
cd example/android
cat gradle.properties | grep "org.gradle"

# Должны быть:
# org.gradle.daemon=true
# org.gradle.parallel=true
# org.gradle.caching=true
```

### Проблема: Metro не видит изменения

**Решение:**
```bash
cd example
yarn start --reset-cache
```

### Проблема: iOS pods не устанавливаются

**Решение:**
```bash
cd example/ios
rm -rf Pods Podfile.lock
pod cache clean --all
RCT_NEW_ARCH_ENABLED=1 pod install
```

### Проблема: TypeScript ошибки

**Решение:**
```bash
cd rn-bottom-sheet
yarn install
cd example
yarn install
```

### Проблема: Reanimated не работает

**Проверьте:**
1. `babel.config.js` - плагин reanimated последний?
2. Перезапустите Metro с очисткой кэша
3. Пересоберите приложение

## 📊 Ожидаемые времена сборки

| Операция | Первый раз | Последующие |
|----------|------------|-------------|
| Android build | 2-3 мин | 10-30 сек |
| iOS build | 3-5 мин | 20-40 сек |
| Metro start | 5-10 сек | 5-10 сек |
| Fast Refresh | - | 1-2 сек |
| Pod install | 2-3 мин | 30-60 сек |

## 🎉 Готово!

Теперь ваше окружение полностью настроено для разработки. Вы можете:

- ✅ Разрабатывать компонент в `src/`
- ✅ Видеть изменения мгновенно через Fast Refresh
- ✅ Тестировать в `example/`
- ✅ Работать с нативным кодом при необходимости

## 📚 Дальнейшие шаги

1. Изучите [DEVELOPMENT.md](./DEVELOPMENT.md) для углубленного понимания рабочего процесса
2. Посмотрите [src/BottomSheet.tsx](./src/BottomSheet.tsx) для понимания архитектуры
3. Экспериментируйте с примером в [example/src/App.tsx](./example/src/App.tsx)

---

**Если возникли вопросы - создайте Issue на GitHub!**
