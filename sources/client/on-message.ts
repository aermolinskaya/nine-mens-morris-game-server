import {
	startGame,
	changePlayer,
	changeBoard,
	changeMerellus,
	changeFreeCheckers,
	changePlayerState,
	showMistake,
	closeMistake,
	endGame,
	setSendMessage
} from './game.js';

import type {
	AnyServerMessage,
} from '../common/messages.js';

/**
 * Функция отправки сообщений на сервер
 */
type SendMessage = typeof import( './connection.js' ).sendMessage;

/**
 * Обрабатывает сообщения от сервера
 * 
 * @param sendMessage Функция отправки сообщений
 * @param data Пришедшие данные
 */
function onMessage( sendMessage: SendMessage, data: unknown ): void
{
	console.log( 'Message received: ' + data );
	setSendMessage( sendMessage );
	
	const message = parseData( data );
	
	processMessage( sendMessage, message );
}

/**
 * Выполняет разбор пришедших с сервера данных
 * 
 * @param data Пришедшие данные
 */
function parseData( data: unknown ): AnyServerMessage
{
	if ( typeof data !== 'string' )
	{
		return {
			type: 'incorrectResponse',
			message: 'Wrong data type',
		};
	}
	
	try
	{
		return JSON.parse( data );
	}
	catch ( error )
	{
		return {
			type: 'incorrectResponse',
			message: 'Can\'t parse JSON data: ' + error,
		};
	}
}

/**
 * Выполняет действие, соответствующее полученному сообщению
 * 
 * @param sendMessage Функция отправки сообщений
 * @param message Пришедшее сообщение
 */
function processMessage( sendMessage: SendMessage, message: AnyServerMessage ): void
{
	switch ( message.type )
	{
		case 'gameStarted':
			startGame( message.myTurn );
			changePlayer( message.myTurn );
			break;
		
		case 'changePlayer':
			changePlayer( message.myTurn );
			break;
		
		case 'gameResult':
			changePlayerState( 'finish' );
			endGame( message.win ? 'win' : 'loose' );
			break;
		
		case 'changeBoard':
			changeBoard( message.busyField );
			closeMistake();
			break;
		
		case 'changeFreeCheckers':
			changeFreeCheckers( message.color, message.freeCheckers );
			break;
		
		case 'changePlayerState':
			changePlayerState( message.myState );
			break;
		
		case 'changeMerellus':
			changeMerellus( message.lines );
			break;
		
		case 'gameAborted':
			endGame( 'abort' );
			break;
		
		case 'incorrectRequest':
			console.error( 'Incorrect request: ', message.message );
			showMistake( message.message );
			break;
		
		case 'incorrectResponse':
			sendMessage( message );
			break;
		
		default:
			sendMessage( {
				type: 'incorrectResponse',
				message: `Unknown message type: "${(message as AnyServerMessage).type}"`,
			} );
			break;
	}
}

export {
	onMessage,
};