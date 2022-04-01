import { ViewEntity, ViewColumn } from 'typeorm';
import { GameCategory } from './game.entity';
import { Ladder } from './ladder.entity';

const categories = `'${GameCategory.RANKED}'`;
const points_calcul = `1000 + (victories * 10 - defeats * 10) + victories`;

const game_victories = ` 
(
  SELECT   winner_id
          ,COUNT(*)          AS victories
          ,SUM(score_winner) AS score_victories
  FROM "game"
  WHERE category IN (${categories}) 
  GROUP BY  winner_id
) 
AS "game_victories"
`;

const game_defeats = `
(
  SELECT   loser_id
          ,COUNT(*)         AS defeats
          ,SUM(score_loser) AS score_defeats
  FROM "game"
  WHERE category IN (${categories}) 
  GROUP BY  loser_id
)
AS "game_defeats"
`;

const all_victories = `
(
  SELECT   id                          AS winner_id
          ,COALESCE(victories,0 )      AS victories
          ,COALESCE(score_victories,0) AS score_victories
  FROM "user"
  FULL JOIN ${game_victories} 
  ON "game_victories".winner_id = "user".id
) 
AS "all_victories"
`;

const all_defeats = `
(
  SELECT id                        AS loser_id
        ,COALESCE(defeats,0 )      AS defeats
        ,COALESCE(score_defeats,0) AS score_defeats
  FROM "user"
  FULL JOIN ${game_defeats} 
  ON "game_defeats".loser_id = "user".id
) 
AS "all_defeats"
`;

const ladder_points = `
(
	SELECT loser_id        AS id
	       ,defeats
	       ,score_defeats
	       ,victories
	       ,score_victories
	       ,${points_calcul} AS points
	FROM ${all_defeats}
  FULL JOIN ${all_victories}
  ON "all_defeats".loser_id = "all_victories".winner_id
) 
AS "ladder_points"
`;

const ladderWithPosition = `
SELECT  *
       ,ROW_NUMBER () OVER (ORDER BY points DESC) AS position
FROM ${ladder_points}
WHERE id IS NOT NULL
`;

@ViewEntity({
  expression: ladderWithPosition,
})
export class LadderView extends Ladder {}
