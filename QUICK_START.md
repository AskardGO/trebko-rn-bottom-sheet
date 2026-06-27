# 🚀 Быстрый старт

Минимальная инструкция для запуска разработки библиотеки `rn-bottom-sheet`.

## ⚡ За 3 шага

### 1️⃣ Установите зависимости

```bash
# Корень библиотеки
cd rn-bottom-sheet
yarn install

# Тестовое приложение
cd example
yarn install
```

### 2️⃣ Запустите на Android

```bash
cd example

# Терминал 1 - Metro
yarn start

# Терминал 2 - Android
yarn android
```

**Первая сборка:** 2-3 минуты  
**Последующие:** 10-30 секунд

### 3️⃣ Запустите на iOS

```bash
cd example

# Установить pods с New Architecture
cd ios
RCT_NEW_ARCH_ENABLED=1 pod install
cd ..

# Запустить приложение
yarn ios
```

**Первая сборка:** 3-5 минут  
**Последующие:** 20-40 секунд

## 🎨 Начните разрабатывать

Откройте файл `src/BottomSheet.tsx` и внесите изменения. Они появятся в приложении через 1-2 секунды благодаря Fast Refresh!

## 📚 Дальше

- [SETUP.md](./SETUP.md) - Подробная настройка окружения
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Рабочий процесс разработки
- [README.md](./README.md) - Использование библиотеки

## ❓ Проблемы?

### Metro не видит изменения
```bash
yarn start --reset-cache
```

### Android долго собирается
Проверьте `example/android/gradle.properties`:
- `org.gradle.daemon=true`
- `org.gradle.caching=true`

### iOS pods не устанавливаются
```bash
cd example/ios
rm -rf Pods Podfile.lock
RCT_NEW_ARCH_ENABLED=1 pod install
```

---

**Готово! Теперь вы можете разрабатывать modern bottom sheet с New Architecture 🎉**
