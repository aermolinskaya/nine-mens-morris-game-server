import WebSocket from 'ws';
import type { Color } from '../../common/color.js';
import type { PlayerState } from '../../common/playerState.js';

/**
 * Класс игрока
 * 
 * Идентифицирует игрока и содержит его данные по игре.
 */
class Player
{
	/**
	 * Цвет фишек игрока
	 */
	private _color!: Color;
	/**
	 * Количество свободных (не выставленных на поле) фишек игрока
	 */
	private _freeCheckersNumber!: number;
	/**
	 * Состояние игрока в соответствии с его этапом игры
	 */
	private _playerState!: PlayerState;
	/**
	 * Соединение с игроком
	 */
	private _connection: WebSocket;
	
	/**
	 * @param connection Соединение с игроком
	 * @param color Присуждаемый игроку цвет фишек
	 */
	constructor( connection: WebSocket, color: Color )
	{
        this.init( color );
		this._connection = connection;
	}
	
	/**
	 * Инициализирует игрока к началу игры
	 * 
	 * @param color Присуждаемый игроку цвет фишек
	 */
	init( color: Color ): void
	{
		this._color = color;
		this._freeCheckersNumber = Player.START_CHECKERS_NUMBER;
		this._playerState = '1_part';
	}
	
	/**
	 * Количество всех фишек игрока
	 */
	static get START_CHECKERS_NUMBER(): number
	{
		return 9;
	}
	/**
	 * Цвет фишек игрока
	 */
	get сolor(): Color
	{
		return this._color;
	}
	/**
	 * Количество свободных (не выставленных на поле) фишек игрока
	 */
	get freeCheckers(): number
	{
		return this._freeCheckersNumber;
	}
	/**
	 * Состояние игрока в соответствии с его этапом игры
	 */
	get playerState(): PlayerState
	{
		return this._playerState;
	}
	/**
	 * Соединение с игроком
	 */
	get connection(): WebSocket
	{
		return this._connection;
	}
	
	/**
	 * Уменьшает количество свободных фишек игрока на одну
	 */
	setCheckerOnBoard(): number
	{
		if ( this._freeCheckersNumber > 0 )
		{
			this._freeCheckersNumber--;
		}
		return this._freeCheckersNumber;
	}
	/**
	 * Обновляет состояние игрока
	 * 
	 * @param newPlayerState Новое состояние игрока
	 */
	setPlayerState( newPlayerState: PlayerState ): void
	{
		this._playerState = newPlayerState;
	}
}

export {
    Player
};