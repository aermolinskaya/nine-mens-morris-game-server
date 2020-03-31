import type { PlayerState } from '../../common/playerState.js';
import type { Color } from '../../common/color.js';

/**
 * Поле вывода подсказки по ходу игры
 */
const hintMessage = document.querySelector( '.hint p' ) as HTMLParagraphElement;
/**
 * Поле вывода ошибки по ходу игры
 */
const errorMessage = document.querySelector( '.error-message p' ) as HTMLParagraphElement;
/**
 * Кнопка прерывания игры
 */
const buttonAbortGame = document.querySelector( '.button-stop-game' ) as HTMLButtonElement;
/**
 * Клетки игрового поля
 */
const cells: NodeList = document.querySelectorAll( '.field-cells > .cell' );
/**
 * Линии мельниц на игровом поле
 */
const merellus: NodeList = document.querySelectorAll( '.merellus' );

if ( !hintMessage || !errorMessage || !buttonAbortGame || !cells || !merellus )
{
	throw new Error( 'Can\'t find required elements on "game" screen' );
}

/**
 * Мой ход?
 */
let myTurn: boolean;
/**
 * Моё состояние по этапу игры
 */
let myState: PlayerState;
/**
 * Моё информационное поле игрока
 */
let myUserInfo: HTMLElement;
/**
 * Информационное поле соперника
 */
let notMyUserInfo: HTMLElement;

/**
 * Обработчик хода игрока собственными фишками
 */
type MoveCheckerHandler = ( from: string | null, to: string ) => void;
/**
 * Обработчик хода игрока собственными фишками
 */
let moveCheckerHandler: MoveCheckerHandler;

/**
 * Обработчик удаления фишки соперника игроком
 */
type RemoveCheckerHandler = ( from: string ) => void;
/**
 * Обработчик удаления фишки соперника игроком
 */
let removeCheckerHandler: RemoveCheckerHandler;



addBoardListeners();

/**
 * Добавляет обработчики событий на клетки игрового поля
 */
function addBoardListeners(): void
{
	for ( let i = 0; i < cells.length; i++ )
	{
		const cell = cells[i] as HTMLButtonElement;
		
		cell.addEventListener(
			'click',
			() =>
			{
				if ( !myTurn  ||  myState === 'finish' )
				{
					return;
				}
				
				if ( cell === document.querySelector( '.cell.selected' ) )
				{
					cell.classList.toggle( 'selected', false );
					return;
				}
				
				if ( myState === '1_part'  &&  !document.querySelector( '.cell.selected' ) )
				{
					moveCheckerHandler( null, cell.dataset.cellId! );
					return;
				}
				
				if ( myState === '2_part'  ||  myState === '3_part' )
				{
					if ( document.querySelector( '.cell.selected' ) )
					{
						moveCheckerHandler(
							(document.querySelector( '.cell.selected' )! as HTMLElement).dataset.cellId!,
							cell.dataset.cellId!
						);
						
						document.querySelector( '.cell.selected' )!.classList.toggle( 'selected', false );
					}
					else if ( cell.classList.contains( 'cell-' + myUserInfo.classList[1] ) )
					{
						cell.classList.toggle( 'selected', true );
					}
					
					return;
				}
				
				if ( myState === 'removingChecker'  &&  !document.querySelector( '.cell.selected' ) )
				{
					removeCheckerHandler( cell.dataset.cellId! );
					return;
				}
			}
		);
	}
}

/**
 * Возвращает порядковый номер игрока по цвету его фишек
 * 
 * @param color Цвет фишек игрока
 */
function getPlayerNumber( color: Color ): number
{
	return ( color === 'blue' ? 1 : 2 );
}

/**
 * Устанавливает ходящего игрока
 * 
 * @param isMyTurn Мой ход?
 */
function setCurrentPlayer( isMyTurn: boolean ): void
{
	myTurn = isMyTurn;
	myUserInfo.classList.toggle( 'current-player', myTurn );
	notMyUserInfo.classList.toggle( 'current-player', !myTurn );
}

/**
 * Обновляет подходящую подсказку по этапу и ходу в игре
 */
function addChangingPlayerHintMessage(): void
{
	if ( myTurn )
	{
		switch ( myState )
		{
			case '1_part':
				hintMessage.textContent = 'Вы выставляете свою фишку на любую клетку поля';
				break;
			
			case '2_part':
				hintMessage.textContent = 'Вы передвигаете свою фишку на один ход вдоль линии';
				break;
			
			case '3_part':
				hintMessage.textContent = 'Вы передвигаете свою фишку на любую клетку поля';
				break;
			
			case 'removingChecker':
				hintMessage.textContent = 'Вы построили мельницу и сейчас убираете любую фишку второго игрока';
				break;
			
			case 'finish':
				hintMessage.textContent = 'Игра завершена';
				break;
			
			default:
				console.log( 'Player state is not defined: ' + myState );
				break;
		}
	}
	else
	{
		hintMessage.textContent = 'Ожидание хода соперника';
	}
}

/**
 * Инициирует новую игру
 * 
 * @param isMyTurn Мой ход?
 */
function initGame( isMyTurn: boolean ): void
{
	clearField();
	
	myTurn = isMyTurn;
	
	if ( myTurn )
	{
		myUserInfo = document.querySelector( '.user-info.player-1' ) as HTMLElement;
		notMyUserInfo = document.querySelector( '.user-info.player-2' ) as HTMLElement;
	}
	else
	{
		myUserInfo = document.querySelector( '.user-info.player-2' ) as HTMLElement;
		notMyUserInfo = document.querySelector( '.user-info.player-1' ) as HTMLElement;
	}
	
	myUserInfo.querySelector( '.player-name' )!.textContent = 'Вы';
	notMyUserInfo.querySelector( '.player-name' )!.textContent = 'Другой игрок';
	
	if ( !myUserInfo || !notMyUserInfo )
	{
		throw new Error( 'Can\'t find required elements on "game" screen' );
	}
	
	updatePlayerState( '1_part' );
	
	updateFreeCheckers( 'blue', 9 );
	updateFreeCheckers( 'red', 9 );
}


/**
 * Очищает поле игры
 */
function clearField(): void
{
	for ( const cell of document.querySelectorAll( '.field-cells > .cell-player-1' ) )
	{
		cell.classList.toggle( 'cell-player-1', false );
	};
	for ( const cell of document.querySelectorAll( '.field-cells > .cell-player-2' ) )
	{
		cell.classList.toggle( 'cell-player-2', false );
	};
	
	for ( const line of document.querySelectorAll( '.line-player-1' ) )
	{
		line.classList.toggle( 'line-player-1', false );
	};
	for ( const line of document.querySelectorAll( '.line-player-2' ) )
	{
		line.classList.toggle( 'line-player-2', false );
	};
}

/**
 * Обновляет отображаемое поле свободных фишек игрока
 * 
 * @param color Цвет обновляемых фишек игрока
 * @param freeCheckersNumber Новое количество свободных фишек
 */
function updateFreeCheckers( color: Color, freeCheckersNumber: number): void
{
	const freeCheckersField = document.querySelectorAll(
		`.player-${getPlayerNumber(color)} > .player-free-checkers > .cell`
	);
	
	for ( let counter = 0; counter < freeCheckersNumber; counter++ )
	{
		freeCheckersField[ counter ].removeAttribute( 'hidden' );
	}
	for ( let counter = freeCheckersNumber; counter < freeCheckersField.length; counter++ )
	{
		freeCheckersField[ counter ].setAttribute( 'hidden', 'hidden' );
	}
}

/**
 * Обновляет ходящего игрока
 * 
 * @param isMyTurn Мой ход?
 */
function updatePlayer( isMyTurn: boolean ): void
{
	myTurn = isMyTurn;
	setCurrentPlayer( isMyTurn );
	addChangingPlayerHintMessage();
}

/**
 * Обновляет фишки на поле игры
 * 
 * @param busyField Расположение выставленных фишек с их цветами
 */
function updateField( busyField: {[cell: string]: Color;} ): void
{
	for ( let i = 0; i < cells.length; i++ )
	{
		const cell = cells[i] as HTMLButtonElement;
		cell.classList.toggle( 'cell-player-1', false );
		cell.classList.toggle( 'cell-player-2', false );
		
		if ( busyField[ cell.dataset.cellId! ] !== undefined )
		{
			cell.classList.toggle( 'cell-player-' + getPlayerNumber( busyField[ cell.dataset.cellId! ] ), true );
		}
	}
}

/**
 * Обновляет мельницы на поле игры
 * 
 * @param lines Расположение построенных мельниц с их цветами
 */
function updateMerellus( lines: {[line: string]: Color;} ): void
{
	for ( let i = 0; i < merellus.length; i++ )
	{
		const line = merellus[i] as HTMLElement;
		line.classList.toggle( 'line-player-1', false );
		line.classList.toggle( 'line-player-2', false );
		
		if ( lines[ line.dataset.lineId! ] !== undefined )
		{
			line.classList.toggle( 'line-player-' + getPlayerNumber( lines[ line.dataset.lineId! ] ), true );
		}
	}
};

/**
 * Обновляет собственное состояние игрока
 * 
 * @param myNewState Новое состояние игрока
 */
function updatePlayerState( myNewState: PlayerState ): void
{
	myState = myNewState;
	addChangingPlayerHintMessage();
}

/**
 * Показывает поле вывода ошибки
 * 
 * @param message Текст ошибки
 */
function updateMistakeOutput( message: string ): void
{
	errorMessage.textContent = message;
	errorMessage.parentElement!.classList.toggle( 'message-empty', false );
}

/**
 * Прячет поле вывода ошибки
 */
function closeMistakeOutput(): void
{
	errorMessage.parentElement!.classList.toggle( 'message-empty', true );
}

/**
 * Обновляет подсказку информацией о завершении игры
 */
function addEndGameHint(): void
{
	hintMessage.textContent = 'Игра завершена';
}

/**
 * Устанавливает обработчики хода игрока
 * 
 * @param handlerMovingChecker Обработчик хода игрока собственными фишками
 * @param handlerRemovingChecker Обработчик удаления фишки соперника игроком
 */
function setMoveCheckerHandler(
	handlerMovingChecker: MoveCheckerHandler,
	handlerRemovingChecker: RemoveCheckerHandler
): void
{
	moveCheckerHandler = handlerMovingChecker;
	removeCheckerHandler = handlerRemovingChecker;
}

/**
 * Устанавливает обработчик прерывания игры
 * 
 * @param listener Обработчик прерывания игры
 */
function setAbortGameHandler( listener: ( event: MouseEvent ) => void ): void
{
	buttonAbortGame.addEventListener( 'click', listener );
}

export {
	updatePlayer,
	updateField,
	updateMerellus,
	updatePlayerState,
	updateFreeCheckers,
	updateMistakeOutput,
	closeMistakeOutput,
	addEndGameHint,
	initGame,
	setMoveCheckerHandler,
	setAbortGameHandler,
};