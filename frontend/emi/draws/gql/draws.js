import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document
export const LotteryDraw = gql`
  query LotteryDraw($id: String!) {
    LotteryDraw(id: $id) {
      id
    }
  }
`;

export const LotteryLotteries = gql`
  query LotteryLotteries {
    LotteryDraw{
      id
      name
    }
  }
`;

export const LotteryDraws = gql`
  query LotteryDraws($filterInput: LotteryDrawFilterInput!, $paginationInput: LotteryDrawPaginationInput!) {
    LotteryDraws(filterInput: $filterInput, paginationInput: $paginationInput) {
      id
    }
  }
`;

export const LotteryDrawsSize = gql`
  query LotteryDrawsSize($filterInput: LotteryDrawFilterInput!) {
    LotteryDrawsSize(filterInput: $filterInput)
  }
`;

// MUTATIONS
export const LotteryDrawConfirmResults = gql`
  mutation LotteryDrawConfirmResults($drawId: String!, $results: ConfirmedResultsInput) {
    LotteryDrawConfirmResults(drawId: $drawId, results: $results)
  }
`;

export const LotteryDrawApproveResults = gql`
  mutation LotteryDrawApproveResults($drawId: String!, $approved: Boolean!, $notes: String) {
    LotteryDrawApproveResults(drawId: $drawId, approved: $approved, notes: $notes)
  }
`;

// SUBSCRIPTION
export const LotteryDrawUpdated = gql`
  subscription($drawId: String!){
    LotteryDrawUpdated(drawId: $drawId){
      id
    }
  }
`;
