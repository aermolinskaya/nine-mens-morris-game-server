import type { PlayerState } from './playerState.js';
import type { Color } from './color.js';

/**
 * Начало игры
 */
export type GameStartedMessage = {
	/** Тип сообщения */
	type: 'gameStarted';
	/** Мой ход? */
	myTurn: boolean;
};

/**
 * Игра прервана
 */
export type GameAbortedMessage = {
	/** Тип сообщения */
	type: 'gameAborted';
};

/**
 * Результат игры
 */
export type GameResultMessage = {
	/** Тип сообщения */
	type: 'gameResult';
	/** Победа? */
	win: boolean;
};

/**
 * Ход игрока своими фишками
 */
export type PlayerMoveCheckerMessage = {
	/** Тип сообщения */
	type: 'playerMoveChecker';
	/** Клетка с передвигаемой фишкой, если такая есть */
	from: string | null;
	/** Клетка, в которую выставить фишку */
	to: string;
};

/**
 * Удаление фишки игрока с поля
 */
export type PlayerRemoveCheckerMessage = {
	/** Тип сообщения */
	type: 'playerRemoveChecker';
	/** Клетка, из которой убрать фишку */
	from: string;
};

/**
 * Выставленные фишки на поле игры
 */
export type ChangeBoardMessage = {
	/** Тип сообщения */
	type: 'changeBoard';
	/** Расположение выставленных фишек с их цветами */
	busyField: {[cell: string]: Color;};
};

/**
 * Количество свободных фишек у игрока
 */
export type ChangeFreeCheckersMessage = {
	/** Тип сообщения */
	type: 'changeFreeCheckers';
	/** Цвет фишек */
	color: Color;
	/** Количество свободных фишек */
	freeCheckers: number;
};

/**
 * Построенные мельницы на поле игры
 */
export type ChangeMerellusMessage = {
	/** Тип сообщения */
	type: 'changeMerellus';
	/** Расположение построенных мельниц с их цветами */
	lines: {[line: string]: Color;};
};

/**
 * Собственное состояние игрока
 */
export type ChangePlayerStateMessage = {
	/** Тип сообщения */
	type: 'changePlayerState';
	/** Состояние игрока */
	myState: PlayerState;
};

/**
 * Смена игрока
 */
export type ChangePlayerMessage = {
	/** Тип сообщения */
	type: 'changePlayer';
	/** Мой ход? */
	myTurn: boolean;
};

/**
 * Повтор игры
 */
export type RepeatGame = {
	/** Тип сообщения */
	type: 'repeatGame';
};

/**
 * Некорректный запрос клиента
 */
export type IncorrectRequestMessage = {
	/** Тип сообщения */
	type: 'incorrectRequest';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Некорректный ответ сервера
 */
export type IncorrectResponseMessage = {
	/** Тип сообщения */
	type: 'incorrectResponse';
	/** Сообщение об ошибке */
	message: string;
};

/**
 * Сообщения от сервера к клиенту
 */
export type AnyServerMessage =
	| GameStartedMessage
	| GameAbortedMessage
	| GameResultMessage
	| ChangeBoardMessage
	| ChangeFreeCheckersMessage
	| ChangeMerellusMessage
	| ChangePlayerStateMessage
	| ChangePlayerMessage
	| IncorrectRequestMessage
	| IncorrectResponseMessage;

/** 
 * Сообщения от клиента к серверу
 */
export type AnyClientMessage =
	| GameAbortedMessage
	| PlayerMoveCheckerMessage
	| PlayerRemoveCheckerMessage
	| RepeatGame
	| IncorrectRequestMessage
	| IncorrectResponseMessage;
