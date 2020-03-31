import { openScreen, showScreen, closeScreen } from './screens.js';
import * as GameScreen from './screens/game.js';
import * as ResultScreen from './screens/result.js';
import type { PlayerState } from '../common/playerState.js';
import type { Color } from '../common/color.js';

GameScreen.setMoveCheckerHandler( moveCheckerHandler, removeCheckerHandler );
GameScreen.setAbortGameHandler( abortGameHandler );
ResultScreen.setRestartHandler( restartHandler );
ResultScreen.setCloseMessageHandler( closeResultHandler );

/**
 * Отправляет сообщение на сервер
 */
let sendMessage: typeof import( './connection.js' ).sendMessage;

/**
 * Устанавливает функцию отправки сообщений на сервер
 * 
 * @param sendMessageFunction Функция отправки сообщений
 */
function setSendMessage( sendMessageFunction: typeof sendMessage ): void
{
	sendMessage = sendMessageFunction;
}

/**
 * Обрабатывает ход игрока собственными фишками
 * 
 * @param from Клетка с передвигаемой фишкой
 * @param to Клетка, в которую передвинуть или выставить фишку
 */
function moveCheckerHandler( from: string | null, to: string ): void
{
	sendMessage( {
		type: 'playerMoveChecker',
		from,
		to,
	} );
}

/**
 * Обрабатывает удаление фишки соперника игроком
 * 
 * @param from Клетка с удаляемой фишкой
 */
function removeCheckerHandler( from: string ): void
{
	sendMessage( {
		type: 'playerRemoveChecker',
		from,
	} );
}

/**
 * Обрабатывает прерывание игры игроком
 */
function abortGameHandler(): void
{
	sendMessage( {
		type: 'gameAborted',
	} );
	
	endGame( 'abort' );
}

/**
 * Обрабатывает перезапуск игры
 */
function restartHandler(): void
{
	sendMessage( {
		type: 'repeatGame',
	} );
}

/**
 * Обрабатывает закрытие сообщения с итогом игры
 */
function closeResultHandler(): void
{
	closeScreen( 'result' );
}

/**
 * Начинает игру
 * 
 * @param isMyTurn Мой ход?
 */
function startGame( isMyTurn: boolean ): void
{
	openScreen( 'game' );
	GameScreen.initGame( isMyTurn );
}

/**
 * Меняет активного игрока
 * 
 * @param myTurn Ход текущего игрока?
 */
function changePlayer( myTurn: boolean ): void
{
	GameScreen.updatePlayer( myTurn );
}

/**
 * Обновляет фишки на поле
 * 
 * @param busyField Расположение выставленных фишек с их цветами
 */
function changeBoard( busyField: {[cell: string]: Color;} ): void
{
	GameScreen.updateField( busyField );
}

/**
 * Обновляет мельницы на поле
 * 
 * @param lines Расположение построенных мельниц с их цветами
 */
function changeMerellus( lines: {[line: string]: Color;} ): void
{
	GameScreen.updateMerellus( lines );
}

/**
 * Меняет количество отображаемых свободных фишек игрока
 * 
 * @param color Цвет обновляемых фишек игрока
 * @param freeCheckersNumber Новое количество свободных фишек
 */
function changeFreeCheckers( color: Color, freeCheckersNumber: number ): void
{
	GameScreen.updateFreeCheckers( color, freeCheckersNumber );
};

/**
 * Меняет собственное состояние игрока
 * 
 * @param myState Новое состояние игрока
 */
function changePlayerState( myState: PlayerState ): void
{
	GameScreen.updatePlayerState( myState );
};

/**
 * Показывает поле вывода ошибки
 * 
 * @param message Текст ошибки
 */
function showMistake( message: string ): void
{
	GameScreen.updateMistakeOutput( message );
}

/**
 * Прячет поле вывода ошибки
 */
function closeMistake(): void
{
	GameScreen.closeMistakeOutput();
}

/**
 * Завершает игру
 * 
 * @param result Результат игры
 */
function endGame( result: 'win' | 'loose' | 'abort' ): void
{
	GameScreen.addEndGameHint();
	ResultScreen.update( result );
	showScreen( 'result' );

	if ( result === 'abort' )
	{
		closeScreen( 'game' );
	}
}

export {
	startGame,
	changePlayer,
	changeBoard,
	changeMerellus,
	changeFreeCheckers,
	changePlayerState,
	showMistake,
	closeMistake,
	endGame,
	setSendMessage,
};