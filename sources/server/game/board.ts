import type { Color } from '../../common/color.js';
import configCellLines from './configCellLines.json';

/**
 * Клетки и их линии
 */
type CellLines = {
	[cell: string]: string[];
};
/**
 * Линии и их клетки
 */
type LineCells = {
	[line: string]: string[];
};

/**
 * Возвращает обратное сопоставление линий и их клеток из списка клеток и их линий
 */
function buildLineCells(): LineCells
{
	let configLineCells: LineCells = {};
	for ( const [ cell, lines ] of Object.entries( configCellLines ) )
	{
		for ( const line of lines )
		{
			if ( configLineCells[ line ] === undefined )
			{
				configLineCells[ line ] = [];
			}

			configLineCells[ line ].push( cell );
		}
	}
	return configLineCells;
};

/**
 * Класс игровой доски
 * 
 * Хранит поле выставленных фишек и построенных мельниц,
 * а также правила сопоставления линий и клеток.
 */
class Board
{
	/**
	 * Клетки с выставленными фишками и их цвета
	 */
	private _busyField: {[cell: string]: Color;} = {};
	/**
	 * Линии с построенными мельницами и их цвета
	 */
	private _merellus: {[line: string]: Color;} = {};
	/**
	 * Сопоставление клеток с линиями, на которых они находятся
	 */
	private static readonly _CELL_LINES: CellLines = configCellLines;
	/**
	 * Сопоставление линий с принадлежащими им клетками
	 */
	private static readonly _LINE_CELLS: LineCells = buildLineCells();
	
	/**
	 * Возвращает линии, на которых находится заданная клетка
	 * 
	 * @param cell Заданная клетка
	 */
	static getCellLines( cell: string ): string[]
	{
		return ( Board.isExist( cell ) ? Board._CELL_LINES[ cell ].slice(0) : [] );
	};
	/**
	 * Возвращает клетки, принадлежащие заданной линии
	 * 
	 * @param line Заданная линия
	 */
	static getLineCells( line: string ): string[]
	{
		return ( Board._LINE_CELLS[ line ] !== undefined ? Board._LINE_CELLS[ line ].slice(0) : [] );
	};
	/**
	 * Проверяет, существует ли такая клетка на доске
	 * 
	 * @param cell Заданная клетка
	 */
	static isExist( cell: string ): boolean
	{
		return Board._CELL_LINES[ cell ] !== undefined;
	};
	
	/**
	 * Возвращает клетки с выставленными фишками и их цвета
	 */
	get busyField(): {[cell: string]: Color;}
	{
		return this._busyField;
	};
	/**
	 * Возвращает построенные мельницы и их цвета
	 */
	get merellus(): {[line: string]: Color;}
	{
		return this._merellus;
	};
	
	/**
	 * Проверяет, какая фишка выставлена на клетку
	 * 
	 * @param cell Заданная клетка
	 */
	haveCheckerOn( cell: string ): Color | undefined
	{
		return this._busyField[cell];
	};
	
	/**
	 * Выставляет фишку на клетку
	 * 
	 * @param to Заданная клетка
	 * @param color Цвет фишки
	 */
	setChecker( to: string, color: Color ): void
	{
		this._busyField[to] = color;
	};
	/**
	 * Передвигает фишку с клетки на клетку
	 * 
	 * @param from Клетка с передвигаемой фишкой
	 * @param to Новая клетка
	 */
	moveChecker( from: string, to: string ): void
	{
		this._busyField[to] = this._busyField[from];
		delete this._busyField[from];
	};
	/**
	 * Убирает фишку с клетки
	 * 
	 * @param from Клетка с убираемой фишкой
	 */
	removeChecker( from: string ): void
	{
		delete this._busyField[from];
	};
	
	/**
	 * Проверяет, какая мельница построеная на линии
	 * 
	 * @param line Заданная линия
	 */
	haveMerellusOn( line: string ): Color | undefined
	{
		return this._merellus[line];
	};
	
	/**
	 * Добавляет построенную мельницу на линию
	 * 
	 * @param line Заданная линия
	 * @param color Цвет мельницы
	 */
	setMerellus( line: string, color: Color ): void
	{
		this._merellus[line] = color;
	};

	/**
	 * Возвращает количество выставленных фишек
	 */
	getAllBusyCheckersNumber(): number
	{
		return Object.keys( this._busyField ).length;
	};
	/**
	 * Возвращает количество выставленных фишек определённого цвета
	 * 
	 * @param color Цвет фишек
	 */
	getBusyCheckersNumberByColor( color: Color ): number
	{
		return Object.values( this._busyField ).filter( playerColor => playerColor === color ).length;
	};
	/**
	 * Возвращает список выставленных фишек определённого цвета
	 * 
	 * @param color Цвет фишек
	 */
	getBusyCheckersWithColor( color: Color ): string[]
	{
		let result: string[] = [];
		for ( const checker of Object.keys( this._busyField ) )
		{
			if ( this._busyField[ checker ] === color )
			{
				result.push( checker );
			}
		}
		return result;
	};

	/**
	 * Возвращает количество построенных мельниц
	 */
	getAllMerellusNumber(): number
	{
		return Object.keys( this._merellus ).length;
	};
	/**
	 * Возвращает количество построенных мельниц определённого цвета
	 * 
	 * @param color Цвет мельницы
	 */
	getMerellusNumberByColor( color: Color ): number
	{
		return Object.values( this._merellus ).filter( playerColor => playerColor === color ).length;
	};
	
	/**
	 * Очищает доску от всех выставленных фишек и построенных мельниц
	 */
	clearBoard(): void
	{
		for ( const cell of Object.keys( this._busyField ) )
		{
			delete this._busyField[cell];
		}
		for ( const line of Object.keys( this._merellus ) )
		{
			delete this._merellus[line];
		}
	};
}

export {
    Board
};