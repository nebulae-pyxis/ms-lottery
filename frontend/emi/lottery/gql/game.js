import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document
export const LotteryGame = gql`
  query LotteryGame($id: String!) {
    LotteryGame(id: $id) {
      _id
      generalInfo {
        name
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;


export const LotteryGames = gql`
  query LotteryGames($filterInput: LotteryGameFilterInput!, $paginationInput: LotteryGamePaginationInput!) {
    LotteryGames(filterInput: $filterInput, paginationInput: $paginationInput) {
      _id
      generalInfo {
        name
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const LotteryGamesSize = gql`
  query LotteryGamesSize($filterInput: LotteryGameFilterInput!) {
    LotteryGamesSize(filterInput: $filterInput)
  }
`;
