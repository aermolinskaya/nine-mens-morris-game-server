# nine-mens-morris-game-server

Древняя настольная игра «Мельница» для двух игроков в новом формате.
Реализована версия, известная как «Nine Men’s Morris» («Танец девяти мужчин») аналогично названию типа доски, используемой для игры в неё.

Содержит в себе сервер HTTP для выдачи статики и WebSocket для поддержания соединения с игроками.

## Ключевые характеристики игры

1.	Количество игроков: 2;
2.	Составные элементы: игровое поле, 18 фишек – по 9 каждого цвета;
3.	Вид доски: «Nine Men’s Morris» («Танец девяти мужчин»).

Цель игры: строить «мельницы» – три фишки одного цвета в ряд, добившись в конце игры невозможности соперника построить свою мельницу.

## Правила игры

### Этап I

Пустое игровое поле. Первой начинает синяя сторона. Каждый игрок по очереди выставляет по одной своей фишке на любой свободный кружок (далее – клетка). Если кто-то смог выстроить три свои фишки в ряд по прямой линии – то есть построить мельницу, то он снимает с доски любую из фишек противника. Эта фишка больше не возвращается.

### Этап II

Все фишки выставлены на игровое поле, можно начинать ходить. Игроки по очереди передвигают свои фишки по строгому правилу – только на соседние свободные клетки вдоль линий – с целью построить мельницу и тем самым забрать любую фишку соперника.

### Этап III – ближе к концу игры

Когда у игрока остаётся только три фишки на доске, он получает преимущество: может ходить, переставляя фишку на любую свободную клетку, независимо от линий. Соперник продолжает ходить по-старому, пока у него тоже не останется три фишки.

Игра считается выигранной, когда противник не может построить мельницу – либо на этапе III у него осталось меньше 3-х фишек, либо на этапе II его фишки оказались заперты и не могут сделать ход по линии.

### Примечания

* Оба игрока могут строить мельницу на одной линии несколько раз, но фишка соперника снимается только за первое построение кого-либо из игроков. То есть создание мельницы на этом же месте, но другим игроком в первый для него раз, уже не будет считаться первым для всей игры, а значит и не получится забрать фишку соперника.
* Если игрок за один ход построил сразу две мельницы – снимается 2 фишки соперника.

## Установка и запуск

Устанавливаем зависимости:
```
npm i
```

Запускаем сборку:
```
npm run build
```

Запускаем сервер:
```
npm start
```

## Подключение игроков

В браузере открываем http://localhost:8000/

Игра запускается на двух игроков. Сервер последовательно соединяет подключившихся клиентов в игру.