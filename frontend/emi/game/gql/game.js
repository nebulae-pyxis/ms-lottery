import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document
export const LotteryGame = gql`
  query LotteryGame($id: String!) {
    LotteryGame(id: $id) {
      _id
      generalInfo {
        name
        description
        lotteryId
        type
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const LotteriesFilterInput = gql`
  query LotteriesFilterInput($filterInput: LotteryLotteryFilterInput!, $paginationInput: LotteryLotteryPaginationInput!) {
    LotteryLotteries(filterInput: $filterInput, paginationInput: $paginationInput) {
      _id
      generalInfo {
        name
      }
    }
  }
`;

export const LotteryLottery = gql`
  query LotteryLottery($id: String!) {
    LotteryLottery(id: $id) {
      _id
      generalInfo {
        name
      }
    }
  }
`;

export const LotteryGames = gql`
  query LotteryGames($filterInput: LotteryGameFilterInput!, $paginationInput: LotteryGamePaginationInput!) {
    LotteryGames(filterInput: $filterInput, paginationInput: $paginationInput) {
      _id
      generalInfo {
        name
        description
        lotteryId
        lotteryName
        type
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

export const LotteryCreateGame = gql`
  mutation LotteryCreateGame($input: LotteryGameInput!){
    LotteryCreateGame(input: $input){
      code
      message
    }
  }
`;

export const LotteryUpdateGameGeneralInfo = gql`
  mutation LotteryUpdateGameGeneralInfo($id: ID!, $input: LotteryGameGeneralInfoInput!){
    LotteryUpdateGameGeneralInfo(id: $id, input: $input){
      code
      message
    }
  }
`;

export const LotteryUpdateGameState = gql`
  mutation LotteryUpdateGameState($id: ID!, $newState: Boolean!){
    LotteryUpdateGameState(id: $id, newState: $newState){
      code
      message
    }
  }
`;

//SHEET CONFIG

export const LotteryGameSheetConfigList = gql`
  query LotteryGameSheetConfigList($filterInput: LotteryGameSheetConfigFilterInput!) {
    LotteryGameSheetConfigList(filterInput: $filterInput) {
      _id
    	validFromDraw
    validUntilDraw
    ticketsPerSheet
    ticketPrice
    creationTimestamp
    creationUsername
    creationUserId
    editionTimestamp
    editionUserId
    editionUsername
    approved
    revoked
    revokedNotes
    revokedTimestamp
    revokedUsername
    version
    approvedNotes
    approvedUsername
    approvedTimestamp
    }
  }
`;

export const LotteryGameSheetConfig = gql`
  query LotteryGameSheetConfig($id: String, $filterInput: LotteryGameSheetConfigFilterInput) {
    LotteryGameSheetConfig(id: $id, filterInput: $filterInput) {
      _id
    	validFromDraw
    validUntilDraw
    ticketsPerSheet
    ticketPrice
    creationTimestamp
    creationUsername
    creationUserId
    editionTimestamp
    editionUserId
    editionUsername
    lotteryId
    gameId
    approved
    revoked
    revokedNotes
    revokedTimestamp
    revokedUsername
    version
    approvedNotes
    approvedUsername
    approvedTimestamp
    }
  }
`;

export const CreateLotteryGameSheetConfig = gql`
  mutation CreateLotteryGameSheetConfig($input: LotteryGameConfigSheetInput!) {
    CreateLotteryGameSheetConfig(input: $input) {
      code
   		 message
    }
  }
`;

export const UpdateLotteryGameSheetConfig = gql`
  mutation UpdateLotteryGameSheetConfig($id: ID!, $input: LotteryGameConfigSheetInput!) {
    UpdateLotteryGameSheetConfig(id: $id, input: $input) {
      code
   		 message
    }
  }
`;

export const ApproveLotteryGameSheetConfig = gql`
  mutation ApproveLotteryGameSheetConfig($id: ID!, $approved: String, $approvedNotes: String) {
    ApproveLotteryGameSheetConfig(id: $id, approved: $approved, approvedNotes: $approvedNotes) {
      code
   		 message
    }
  }
`;

export const RevokeLotteryGameSheetConfig = gql`
  mutation RevokeLotteryGameSheetConfig($id: ID!, $revoked: Boolean, $revokedNotes: String) {
    RevokeLotteryGameSheetConfig(id: $id, revoked: $revoked, revokedNotes: $revokedNotes) {
      code
   		 message
    }
  }
`;



// SUBSCRIPTION
export const LotteryGameSheetConfigUpdatedSubscription = gql`
  subscription{
    LotteryGameSheetConfigUpdatedSubscription{
      _id
    	validFromDraw
    validUntilDraw
    ticketsPerSheet
    ticketPrice
    creationTimestamp
    creationUsername
    creationUserId
    editionTimestamp
    editionUserId
    editionUsername
    lotteryId
    gameId
    approved
    revoked
    revokedNotes
    revokedTimestamp
    revokedUsername
    version
    approvedNotes
    approvedUsername
    approvedTimestamp
    }
  }
`;

export const LotteryGameUpdatedSubscription = gql`
  subscription{
    LotteryGameUpdatedSubscription{
      _id
      generalInfo {
        name
        description
        lotteryId
        type
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;
