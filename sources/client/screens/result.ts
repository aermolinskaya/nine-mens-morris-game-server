/**
 * Сообщение с итогом игры
 */
const message = document.querySelector( '.result-elem > p' ) as HTMLParagraphElement;
/**
 * Кнопка перезапуска игры
 */
const restart = document.querySelector( '.result-elem > .button-repeat-game' ) as HTMLButtonElement;
/**
 * Кнопка закрытия сообщения с итогом игры
 */
const closeMessage = document.querySelector( '.result-elem > .button-close' ) as HTMLButtonElement;

if ( !message || !restart || !closeMessage )
{
	throw new Error( 'Can\'t find required elements on "result" screen' );
}

/**
 * Обновляет экран завершения игры
 * 
 * @param result Результат, с которым игра завершилась
 */
function update( result: 'win' | 'loose' | 'abort' ): void
{
	restart.hidden = false;
	
	let text: string;
	
	switch ( result )
	{
		case 'win':
			text = 'Вы победили!';
			break;
		
		case 'loose':
			text = 'Победил другой игрок.';
			break;
		
		case 'abort':
			text = 'Игра прервана.';
			restart.hidden = true;
			break;
		
		default:
			throw new Error( `Wrong game result "${result}"` );
	}
	
	message.textContent = text;
}

/**
 * Устанавливает обработчик перезапуска игры
 * 
 * @param listener Обработчик перезапуска игры
 */
function setRestartHandler( listener: ( event: MouseEvent ) => void ): void
{
	restart.addEventListener( 'click', listener );
}

/**
 * Устанавливает обработчик закрытия окна с итогом игры
 * 
 * @param listener Обработчик закрытия окна с итогом игры
 */
function setCloseMessageHandler( listener: ( event: MouseEvent ) => void ): void
{
	closeMessage.addEventListener( 'click', listener );
}

export {
	update,
	setRestartHandler,
	setCloseMessageHandler,
};