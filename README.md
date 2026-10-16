# Linar Abzalov — GIS & Data Portfolio

Англоязычный статический сайт на Astro 7, TypeScript и MDX. Исходная анимация из **Map animation** сохранена отдельно и используется как основа реальной Hero-анимации.

## Локальный запуск

Нужен Node.js 24 LTS и npm. В PowerShell:

```powershell
cd "C:\Users\linar\Documents\Portfolio Website"
npm.cmd ci
npm.cmd run prepare:map
npm.cmd run dev
```

Откройте адрес, выведенный Astro (обычно http://127.0.0.1:4321/).

Проверка и production-сборка: `npm.cmd run check`, `npm.cmd run build`. Результат — папка `dist/`. Просмотр сборки: `npm.cmd run preview`. Не открывайте index.html через file://: ссылки рассчитаны на HTTP-сервер.

## Контент

- `src/data/site.ts` — контакты, About, инструменты, путь к фото и CV.
- `src/data/experience.ts` — работодатели. Должности, даты и достижения пока не предоставлены; пустые поля скрыты.
- `src/content/projects/*.mdx` — четыре реальных проекта, описания по переданным источникам.
- `public/media/projects/` — локальные обложки и графики.
- `src/styles/tokens.css` — палитра, шрифты и базовые параметры.

### Добавление проекта

1. Создайте `src/content/projects/my-project.mdx`. Имя файла задаёт адрес `/projects/my-project/`.
2. Добавьте frontmatter по примеру существующего проекта: title, subtitle, summary, category, technologies, order; `featured: true` включает карточку на главной. `draft: true` скрывает и карточку, и страницу.
3. Положите изображения в `public/media/projects/my-project/`; укажите `coverImage: /media/projects/my-project/preview.webp` и содержательный coverAlt. Не добавляйте BASE_PATH к контентным путям: это делает приложение.
4. Напишите содержимое под заголовками второго уровня. Они автоматически образуют оглавление. Не создавайте пустые разделы. liveUrl, repositoryUrl, role, region, year и dataSources необязательны.
5. Запустите check и build.

В MDX доступны `<Gallery images={[{src:'/media/projects/.../image.webp',alt:'Description',caption:'Caption'}]} />`, `<Callout>...</Callout>` и `<MediaText>...</MediaText>`, а также таблицы и блоки кода. Для MediaText именованный слот media задаётся элементом с `slot="media"`. Ссылки галереи открывают оригинал без JavaScript; с JavaScript используется lightbox, закрываемый Escape.

Для портрета положите файл в public/media/profile и заполните portrait в site.ts. Для CV положите реальный PDF в public/cv и заполните cv. До этого используется нейтральная монограмма и скрыта кнопка скачивания.

## Карта Hero

Оригинальные HTML и GeoJSON в Map animation не изменены. scripts/prepare-world-map.mjs использует ту же проекцию, геометрию, исправление направления колец и обработку Антарктиды. D3 и jsdom работают только при сборке, создавая src/generated/world.svg. Браузеру не нужны D3 CDN, GeoJSON-запросы и картографические тайлы для Hero.

Клиентский src/scripts/map-animation.ts сохраняет двухстороннюю прорисовку, светящиеся наконечники, задержку островов, последующее заполнение и спокойное мерцание. Без JS и при reduced motion видна статичная карта. Если меняете геоданные, снова выполните prepare:map.

## GitHub Pages и домен

1. Создайте репозиторий и загрузите этот проект (node_modules, dist и .astro исключены). Сохраните Map animation: это источник геометрии сборки.
2. В Settings → Pages выберите GitHub Actions.
3. Push в main или ручной запуск workflow соберёт и опубликует сайт. configure-pages передаёт origin и base_path, поэтому поддерживаются как корневой Solar-P.github.io, так и адрес проекта /repository-name/.
4. Для собственного домена настройте Custom domain в Pages и DNS у провайдера. Если нужен CNAME-файл, добавьте public/CNAME с реальным доменом. Workflow получит новый адрес через configure-pages.

Для ручной сборки с доменом в PowerShell:

```powershell
$env:SITE_URL = 'https://YOUR-DOMAIN'
$env:BASE_PATH = '/'
npm.cmd run build
```

Для project Pages используйте SITE_URL `https://solar-p.github.io` и BASE_PATH `/REPOSITORY-NAME`. Реальный адрес портфолио ещё не указан: локальная сборка намеренно не выдаёт вымышленный canonical или sitemap. При SITE_URL создаются canonical, абсолютные Open Graph URL и sitemap-index.xml; robots.txt ссылается на sitemap.

## Источники и изображения

- Atlas: описание пользователя и снимок публичной стартовой страницы https://atlas.world-exploration-map.workers.dev/ (без выдуманных путешествий или статистики).
- Manchester: https://github.com/Solar-P/manchester-building-age-map/blob/main/README.md и снимок реальной карты. Данные OSM/Geofabrik, OS Open UPRN и EPC; атрибуция карты сохранена в полном снимке и в тексте кейса.
- Customer reliability: переданный ноутбук на коммите 5266e5f18fc69352fb2ea274e6c4ac41e7742cf3. Диаграмма в портфолио перерисована по его итоговой таблице, оригинал SVG сохранён рядом.
- Bike-share: https://github.com/Solar-P/Bike_share_company_analysis_R/blob/main/bike-share-company-case-study.ipynb. Графики извлечены из встроенных PNG оригинального ноутбука. Cyclistic — учебный сценарий, данные — Divvy.
- Hero: предоставленные пользователем контуры Natural Earth / ArcGIS export. Natural Earth — public domain: https://www.naturalearthdata.com/about/terms-of-use/.
- Inter и Space Grotesk локально подключены из Fontsource; лицензии OFL находятся в пакетах @fontsource-variable.

Публикация в интернет пока не выполнена: нужен репозиторий назначения. Нет формы, серверной базы, аналитики или API-ключей.


## Изображения и видео в верхнем блоке кейса

Положите файлы в public/media/projects/имя-проекта/ и добавьте список media во frontmatter соответствующего MDX. Порядок записей определяет порядок слайдов. Можно смешивать изображения и видео MP4/WebM (поддержка кодека зависит от браузера). Видео имеет стандартные элементы управления, не запускается автоматически и при смене слайда останавливается. Изображения открываются в увеличенном виде. Без media используется coverImage. Обложка карточки на главной по-прежнему задаётся отдельно через coverImage.

Пример (замените пути существующими файлами):

~~~yaml
media:
  - type: image
    src: /media/projects/example/map.webp
    alt: Map of the study area
    caption: Study area
  - type: video
    src: /media/projects/example/demo.mp4
    alt: Interactive map demonstration
    poster: /media/projects/example/poster.webp
    caption: Exploring the map
~~~

Это статический сайт: загрузки через админ-панель сейчас нет. Файлы и MDX добавляются в проект, затем сайт пересобирается. Работающий пример с тремя изображениями — Bike-share Behaviour.
