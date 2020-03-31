/**
 * Возможные состояния игрока по этапам игры
 */
export type PlayerState = 
    | "1_part"
    | "2_part"
    | "3_part"
    | "removingChecker"
    | "finish";