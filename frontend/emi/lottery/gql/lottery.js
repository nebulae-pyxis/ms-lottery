import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document
export const LotteryLottery = gql`
  query LotteryLottery($id: String!) {
    LotteryLottery(id: $id) {
      _id
      generalInfo {
        name
        lotteryCode
        vat
        contactName
        contactPhone
        address
        description
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const LotteryLotteries = gql`
  query LotteryLotteries($filterInput: LotteryLotteryFilterInput!, $paginationInput: LotteryLotteryPaginationInput!) {
    LotteryLotteries(filterInput: $filterInput, paginationInput: $paginationInput) {
      _id
      generalInfo {
        name
        lotteryCode
        vat
        contactName
        contactPhone
        address
        description
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const LotteryLotteriesSize = gql`
  query LotteryLotteriesSize($filterInput: LotteryLotteryFilterInput!) {
    LotteryLotteriesSize(filterInput: $filterInput)
  }
`;

export const LotteryCreateLottery = gql `
  mutation LotteryCreateLottery($input: LotteryLotteryInput!){
    LotteryCreateLottery(input: $input){
      code
      message
    }
  }
`;

export const LotteryUpdateLotteryGeneralInfo = gql `
  mutation LotteryUpdateLotteryGeneralInfo($id: ID!, $input: LotteryLotteryGeneralInfoInput!){
    LotteryUpdateLotteryGeneralInfo(id: $id, input: $input){
      code
      message
    }
  }
`;

export const LotteryUpdateLotteryState = gql `
  mutation LotteryUpdateLotteryState($id: ID!, $newState: Boolean!){
    LotteryUpdateLotteryState(id: $id, newState: $newState){
      code
      message
    }
  }
`;

// SUBSCRIPTION
export const LotteryLotteryUpdatedSubscription = gql`
  subscription{
    LotteryLotteryUpdatedSubscription{
      _id
      generalInfo {
        name
        vat
        contactName
        contactPhone
        address
        description
      }
      state
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;
