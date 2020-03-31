import WebSocket from 'ws';
import { onError } from './on-error.js';

import type {
	AnyClientMessage,
	AnyServerMessage,
	GameStartedMessage,
	GameAbortedMessage,
} from '../../common/messages.js';

import type { Color } from '../../common/color.js';
import type { PlayerState } from '../../common/playerState.js';
import { Player } from './player.js';
import { Board } from './board.js';

/**
 * Класс игры
 * 
 * Запускает игровую сессию.
 */
class Game
{
	/**
	 * Количество игроков в сессии
	 */
	static readonly PLAYERS_IN_SESSION = 2;
	
	/**
	 * Игровая доска
	 */
	private _board: Board;
	/**
	 * Игроки игровой сессии
	 */
	private _session: Player[] = [];
	/**
	 * Цвет фишек ходящего игрока
	 */
	private _currentPlayerColor!: Color;
	
	/**
	 * @param session Сессия игры, содержащая перечень соединений с игроками
	 */
	constructor( session: WebSocket[] )
	{
		this._board = new Board();
		this._session.push( new Player( session[0], 'blue' ) );
		this._session.push( new Player( session[1], 'red' ) );
		this._setStartGameColor();
		
		this._sendStartMessage()
			.then(
				() =>
				{
					this._listenMessages();
				}
			)
			.catch( onError );
	}
	
	/**
	 * Уничтожает данные игровой сессии
	 */
	destroy(): void
	{
		// Можно вызвать только один раз
		this.destroy = () => {};
		
		for ( const player of this._session )
		{
			if (
				( player.connection.readyState !== WebSocket.CLOSED )
				&& ( player.connection.readyState !== WebSocket.CLOSING )
			)
			{
				const message: GameAbortedMessage = {
					type: 'gameAborted',
				};
				
				this._sendMessage( player.connection, message )
					.catch( onError );
				player.connection.close();
			}
		}
		
		// Обнуляем ссылки
		this._board.clearBoard();
		this._board = null as unknown as Game['_board'];
		this._session = null as unknown as Game['_session'];
		this._currentPlayerColor = null as unknown as Game['_currentPlayerColor'];
	}
	
	/**
	 * Отправляет сообщение о начале игры
	 */
	private _sendStartMessage(): Promise<void[]>
	{
		const data: GameStartedMessage = {
			type: 'gameStarted',
			myTurn: true,
		};
		const promises: Promise<void>[] = [];

		for ( const player of this._session )
		{
			promises.push( this._sendMessage( player.connection, data ) );
			data.myTurn = false;
		}
		
		return Promise.all( promises );
	}
	
	/**
	 * Отправляет сообщение игроку
	 * 
	 * @param player Игрок
	 * @param message Сообщение
	 */
	private _sendMessage( player: WebSocket, message: AnyServerMessage ): Promise<void>
	{
		return new Promise(
			( resolve, reject ) =>
			{
				player.send(
					JSON.stringify( message ),
					( error ) =>
					{
						if ( error )
						{
							reject();
							
							return;
						}
						
						resolve();
					}
				);
			},
		);
	}
	
	/**
	 * Добавляет слушателя сообщений от игроков
	 */
	private _listenMessages(): void
	{
		for ( const player of this._session )
		{
			player.connection.on(
				'message',
				( data ) =>
				{
					const message = this._parseMessage( data );
					
					this._processMessage( player, message );
				},
			);
			
			player.connection.on( 'close', () => this.destroy() );
		}
	}
	
	/**
	 * Разбирает полученное сообщение
	 * 
	 * @param data Полученное сообщение
	 */
	private _parseMessage( data: unknown ): AnyClientMessage
	{
		if ( typeof data !== 'string' )
		{
			return {
				type: 'incorrectRequest',
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
				type: 'incorrectRequest',
				message: 'Can\'t parse JSON data: ' + error,
			};
		}
	}
	
	/**
	 * Выполняет действие, соответствующее полученному сообщению
	 * 
	 * @param player Игрок, от которого поступило сообщение
	 * @param message Сообщение
	 */
	private _processMessage( player: Player, message: AnyClientMessage ): void
	{
		switch ( message.type )
		{
			case 'playerMoveChecker':
				this._onPlayerMoveChecker( message.from, message.to, player );
				break;
			
			case 'playerRemoveChecker':
				this._onPlayerRemoveChecker( message.from, player );
				break;
			
			case 'repeatGame':
				this._restartGame();
				this._session[ 0 ].init( 'blue' );
				this._session[ 1 ].init( 'red' );
				this._sendStartMessage()
					.catch( onError );
				break;
			
			case 'gameAborted':
				this.destroy();
				break;
			
			case 'incorrectRequest':
				this._sendMessage( player.connection, message )
					.catch( onError );
				break;
			
			case 'incorrectResponse':
				console.error( 'Incorrect request: ', message.message );
				break;
			
			default:
				this._sendMessage(
					player.connection,
					{
						type: 'incorrectRequest',
						message: `Unknown message type: "${(message as AnyClientMessage).type}"`,
					},
				)
					.catch( onError );
				break;
		}
	}
	
	/**
	 * Обрабатывает запрос о повторе игры
	 */
	private _restartGame(): void
	{
		this._board.clearBoard();
		this._setStartGameColor();
	}
	
	/**
	 * Инициализирует первого ходящего игрока
	 */
	private _setStartGameColor(): void
	{
		this._currentPlayerColor = 'blue';
	}
	
	/**
	 * Меняет ходящего игрока
	 */
	private _changeCurrentPlayer(): void
	{
		this._currentPlayerColor = (
			this._currentPlayerColor === 'blue' ? 'red' : 'blue'
		);
	}
	
	/**
	 * Возвращает второго (противоположного) игрока
	 * 
	 * @param firstPlayer Первый игрок
	 */
	private _getSecondPlayer( firstPlayer: Player ): Player
	{
		return (
			firstPlayer === this._session[0]
			? this._session[1]
			: this._session[0]
		);
	}
	
	/**
	 * Возвращает актуальное состояние игрока по его этапу игры
	 * 
	 * @param player Игрок
	 */
	private _checkPlayerState( player: Player ): PlayerState
	{
		const player2 = this._getSecondPlayer( player );
		const busyPlayers2CheckersNumber: number = this._board.getBusyCheckersNumberByColor( player2.сolor );
		const busyPlayersMerellusNumber: number = this._board.getMerellusNumberByColor( player.сolor );
		
		if (
			busyPlayersMerellusNumber
			!== ( Player.START_CHECKERS_NUMBER - player2.freeCheckers - busyPlayers2CheckersNumber )
		)
		{
			return 'removingChecker';
		}
		
		if ( player.freeCheckers > 0 )
		{
			return '1_part';
		}
		
		const busyPlayersCheckersNumber: number = this._board.getBusyCheckersNumberByColor( player.сolor );
		
		if (
			busyPlayersCheckersNumber > 3
			&&  !this._areAllCheckersClosed( player.сolor )
		)
		{
			return '2_part';
		}
		else if ( busyPlayersCheckersNumber === 3 )
		{
			return '3_part';
		}
		else
		{
			return 'finish';
		}
	}
	
	/**
	 * Проверяет, возможен ли строгий ход фишки из клетку в клетку вдоль линии на один шаг
	 * 
	 * @param from Клетка с передвигаемой фишкой
	 * @param to Новая клетка
	 */
	private _isPossibleMove( from: string, to: string ): boolean
	{
		let notCommonLine: string[] = Board.getCellLines( from );
		for ( const line of Board.getCellLines( to ) )
		{
			if ( notCommonLine.includes( line ) )
			{
				notCommonLine.splice( notCommonLine.indexOf( line ), 1 );
			}
			else
			{
				notCommonLine.push( line );
			}
		}

		// Проверка, что фишки на одной общей линии
		if ( notCommonLine.length !== 2 )
		{
			return false;
		}			

		const magicNumber: number = Math.abs(
			Number( notCommonLine[0].slice(5) ) - Number( notCommonLine[1].slice(5) )
		);
		return (
			magicNumber != 2
			&&  magicNumber != 8
		);
	};
	
	/**
	 * Проверяет, закрыта ли фишка в клетке для строгого хода вдоль линии на один шаг
	 * 
	 * @param cell Клетка с фишкой
	 */
	private _isCheckerClosed( cell: string ): boolean
	{
		for ( const line of Board.getCellLines( cell ) )
		{
			for ( const cellOnLine of Board.getLineCells( line ) )
			{
				if (
					this._board.haveCheckerOn( cellOnLine ) === undefined
					&&  this._isPossibleMove( cell, cellOnLine )
				)
				{
					return false;
				}
			}
		}
		return true;
	};
	
	/**
	 * Проверяет, закрыты ли все выставленные фишки игрока
	 * для строгого хода вдоль линии на один шаг
	 * 
	 * @param playerColor Цвет фишек игрока
	 */
	private _areAllCheckersClosed( playerColor: Color ): boolean
	{
		for ( const checker of this._board.getBusyCheckersWithColor( playerColor ) )
		{
			if ( !this._isCheckerClosed( checker ) )
			{
				return false;
			}
		}
		return true;
	};
	
	/**
	 * Проверяет, построена ли у игрока на линии новая, ещё не записанная мельница
	 * 
	 * @param line Проверяемая линия
	 * @param color Цвет фишек игрока
	 */
	private _checkNewMerellusOnLine( line: string, color: Color ): boolean
	{
		if ( this._board.haveMerellusOn( line ) !== undefined )
		{
			return false;
		}
		for ( const cellOfLine of Board.getLineCells( line ) )
		{
			if ( this._board.haveCheckerOn( cellOfLine ) !== color)
			{
				return false;
			}
		}
		return true;
	}
	
	/**
	 * Возвращает, если есть, новые построенные, но ещё не записанные, мельницы
	 * на линиях, содержащих заданную клетку
	 * 
	 * @param cell Заданная клетка
	 */
	private _isNewMerellus( cell: string ): string[]
	{
		let linesWithNewMerellus: string[] = [];
		for ( const line of Board.getCellLines( cell ) )
		{
			if ( this._checkNewMerellusOnLine( line, this._board.haveCheckerOn( cell )! ) )
			{
				linesWithNewMerellus.push( line );
			}
		}
		return linesWithNewMerellus;
	};
	
	/**
	 * Проверяет, есть записанные, но нереализованные мельницы (не убрана фишка соперника)
	 */
	private _hasUnusedMerellus(): boolean
	{
		return (
			(this._session[0].freeCheckers
			+ this._session[1].freeCheckers
			+ this._board.getAllBusyCheckersNumber()
			+ this._board.getAllMerellusNumber())
			!== (Game.PLAYERS_IN_SESSION * Player.START_CHECKERS_NUMBER)
		);
	};
	
	/**
	 * Отправляет сообщение игроку о том, что сейчас не его ход
	 * 
	 * @param connection Соединение с игроком
	 */
	private _sendIncorrectCurrentPlayerMessage( connection: WebSocket ): void
	{
		this._sendMessage(
			connection,
			{
				type: 'incorrectRequest',
				message: 'Ошибка: ходит другой игрок',
			},
		)
			.catch( onError );
	};
	
	/**
	 * Отправляет сообщение о некорректном ходе игроку
	 * 
	 * @param connection Соединение с игроком
	 * @param message Сообщение
	 */
	private _sendIncorrectMoveMessage( connection: WebSocket, message: string ): void
	{
		this._sendMessage(
			connection,
			{
				type: 'incorrectRequest',
				message,
			},
		)
			.catch( onError );
	};
	
	/**
	 * Отправляет сообщение всем игрокам сессии с состоянием фишек на игровой доске
	 */
	private _sendToAllUpdateBoardMessage(): void
	{
		for ( const player of this._session )
		{
			this._sendMessage(
				player.connection,
				{
					type: 'changeBoard',
					busyField: this._board.busyField,
				},
			)
				.catch( onError );
		}
	};
	
	/**
	 * Отправляет сообщение всем игрокам сессии с состоянием мельниц на игровой доске
	 */
	private _sendToAllUpdateMerellusMessage(): void
	{
		for ( const player of this._session )
		{
			this._sendMessage(
				player.connection,
				{
					type: 'changeMerellus',
					lines: this._board.merellus,
				},
			)
				.catch( onError );
		}
	}
	
	/**
	 * Отправляет сообщение всем игрокам сессии об обновлении количества свободных фишек у заданного игрока
	 * 
	 * @param updatingPlayer Заданный игрок
	 */
	private _sendToAllChangeFreeCheckersMessage( updatingPlayer: Player ): void
	{
		for ( const player of this._session )
		{
			this._sendMessage(
				player.connection,
				{
					type: 'changeFreeCheckers',
					color: updatingPlayer.сolor,
					freeCheckers: updatingPlayer.freeCheckers,
				},
			)
				.catch( onError );
		}
	};
	
	/**
	 * Отправляет сообщение игроку о смене ходящего игрока
	 * 
	 * @param updatingPlayer Игрок, которому отправляется сообщение
	 * @param isPlayerTurn Ход этого игрока?
	 */
	private _sendChangePlayerMessage( updatingPlayer: Player, isPlayerTurn: boolean ): void
	{
		this._sendMessage(
			updatingPlayer.connection,
			{
				type: 'changePlayer',
				myTurn: isPlayerTurn,
			},
		)
			.catch( onError );
	};
	
	/**
	 * Отправляет сообщение игроку об обновлении его состояния в игре
	 * 
	 * @param updatingPlayer Игрок, которому отправляется сообщение
	 */
	private _sendChangePlayerStateMessage( updatingPlayer: Player ): void
	{
		this._sendMessage(
			updatingPlayer.connection,
			{
				type: 'changePlayerState',
				myState: updatingPlayer.playerState,
			},
		)
			.catch( onError );
	};
	
	/**
	 * Отправляет сообщение всем игрокам сессии об окончании игры и её результат
	 */
	private _sendToAllEndGameMessage(): void
	{
		for ( const player of this._session )
		{
			this._sendMessage(
				player.connection,
				{
					type: 'gameResult',
					win: player.сolor !== this._currentPlayerColor,
				},
			)
				.catch( onError );
		}
	};
	
	/**
	 * Обрабатывает запрос игрока на выставление или передвижение своей фишки
	 * 
	 * @param from Клетка, из которой передвинуть фишку
	 * @param to Клетка, в которой должна оказаться фишка
	 * @param currentPlayer Игрок, от которого поступило сообщение
	 */
	private _onPlayerMoveChecker( from: string | null, to: string, currentPlayer: Player): void
	{
		if ( currentPlayer.сolor !== this._currentPlayerColor )
		{
			this._sendIncorrectCurrentPlayerMessage( currentPlayer.connection );
			return;
		}

		if (
			currentPlayer.playerState === 'removingChecker'
			||  currentPlayer.playerState === 'finish'
		)
		{
			this._sendIncorrectMoveMessage( currentPlayer.connection, 'Вы не можете сейчас передвигать свои фишки' );
			return;
		}
		
		// Если from задано, то подразумевается передвижение фишки
		// Если from отсутствует, то подразумевается выставление фишки
		if ( !Board.isExist( to ) )
		{
			this._sendIncorrectMoveMessage( currentPlayer.connection, `Новая клетка ${to} не существует` );
			return;
		}
		else if ( !from )
		{
			// 1-ый этап, нестрогое выставление в любую клетку свободных фишек
			if ( currentPlayer.playerState === '1_part' )
			{
				if ( this._board.haveCheckerOn( to ) === undefined )
				{
					this._board.setChecker( to, currentPlayer.сolor );
					currentPlayer.setCheckerOnBoard();

					this._sendToAllChangeFreeCheckersMessage( currentPlayer );
				}
				else
				{
					this._sendIncorrectMoveMessage( currentPlayer.connection, `Клетка ${to} уже занята` );
					return;
				}
			}
			else
			{
				this._sendIncorrectMoveMessage( currentPlayer.connection, 'Ход не соответствует этапу игры' );
				return;
			}
		}
		else if ( !Board.isExist( from ) )
		{
			this._sendIncorrectMoveMessage( currentPlayer.connection, `Предыдущая клетка ${from} не существует` );
			return;
		}
		else
		{
			// 2-ой этап, строгое передвижение выставленных фишек вдоль линии на 1 шаг
			// или 3-й этап, нестрогое передвижение выставленных фишек в любую клетку
			if (
				this._board.haveCheckerOn( from ) === currentPlayer.сolor
				&&  this._board.haveCheckerOn( to ) === undefined
			)
			{
				if (
					currentPlayer.playerState === '3_part'
					||  ( currentPlayer.playerState === '2_part'  &&  this._isPossibleMove( from, to ) )
				)
				{
					this._board.moveChecker( from, to );
				}
				else
				{
					this._sendIncorrectMoveMessage(
						currentPlayer.connection,
						`Ход из ${from} в ${to} нарушает правила этапа - только строгий ход на одну клетку по линии`
					);
					return;
				}
			}
			else
			{
				this._sendIncorrectMoveMessage( currentPlayer.connection, `Предыдущая клетка ${from} не Ваша или ${to} не пуста` );
				return;
			}
		}
		
		this._sendToAllUpdateBoardMessage();
		
		// Проверка на новые мельницы, их запись
		const newMerellus: string[] = this._isNewMerellus( to );
		for ( const line of newMerellus )
		{
			this._board.setMerellus( line, currentPlayer.сolor );
		}

		// Проверка смены состояний игроков
		for ( const player of this._session )
		{
			const newPlayerState = this._checkPlayerState( player );
			if ( player.playerState !== newPlayerState )
			{
				player.setPlayerState( newPlayerState );
				this._sendChangePlayerStateMessage( player );
			}
		}
		
		// Рассылка новых мельниц только после смены состояний игроков
		if ( newMerellus.length !== 0 )
		{
			this._sendToAllUpdateMerellusMessage();
			return;
		}
		
		// Рассылка всем смены ходящего игрока
		this._changeCurrentPlayer();
		for ( const player of this._session )
		{
			if ( player.сolor === this._currentPlayerColor )
			{
				currentPlayer = player;
				this._sendChangePlayerMessage( player, true );
			}
			else
			{
				this._sendChangePlayerMessage( player, false );
			}
		}
		
		// Конец игры, если ходящий игрок не имеет возможности хода
		if ( currentPlayer.playerState === 'finish' )
		{
			this._sendToAllEndGameMessage();
		}
	}
	
	/**
	 * Обрабатывает запрос игрока удаление фишки соперника с поля
	 * 
	 * @param from Клетка, из которой убрать фишку
	 * @param currentPlayer Игрок, от которого поступило сообщение
	 */
	private _onPlayerRemoveChecker( from: string, currentPlayer: Player): void
	{
		if ( currentPlayer.сolor !== this._currentPlayerColor )
		{
			this._sendIncorrectCurrentPlayerMessage( currentPlayer.connection );
			return;
		}

		if (
			currentPlayer.playerState === 'removingChecker'
			&&  Board.isExist( from )
		)
		{
			if ( this._board.haveCheckerOn( from ) === this._getSecondPlayer( currentPlayer ).сolor )
			{
				this._board.removeChecker( from );
			}
			else
			{
				this._sendIncorrectMoveMessage( currentPlayer.connection, `Клетка ${from} пустая или принадлежит Вам` );
				return;
			}
		}
		else
		{
			this._sendIncorrectMoveMessage(
				currentPlayer.connection,
				`Вы не можете сейчас убрать фишку соперника или клетка ${from} не существует`
			);
			return;
		}
		
		this._sendToAllUpdateBoardMessage();
		
		// Если нереализованных мельниц больше нет, то смена состояний и ходящего игрока
		if ( !this._hasUnusedMerellus() )
		{
			for ( const player of this._session )
			{
				const newPlayerState = this._checkPlayerState( player );
				if ( player.playerState !== newPlayerState )
				{
					player.setPlayerState( newPlayerState );
					this._sendChangePlayerStateMessage( player );
				}
			}
			
			this._changeCurrentPlayer();
			for ( const player of this._session )
			{
				if ( player.сolor === this._currentPlayerColor )
				{
					currentPlayer = player;
					this._sendChangePlayerMessage( player, true );
				}
				else
				{
					this._sendChangePlayerMessage( player, false );
				}
			}
			
			// Конец игры, если ходящий игрок не имеет возможности хода
			if ( currentPlayer.playerState === 'finish' )
			{
				this._sendToAllEndGameMessage();
			}
		}
	}
}

export {
	Game,
};
