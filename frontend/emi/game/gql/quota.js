import gql from "graphql-tag";

export const LotteryGameQuotaList = gql`
  query LotteryGameQuotaList($filterInput: LotteryGameQuotaFilterInput!) {
    LotteryGameQuotaList(filterInput: $filterInput) {
      _id
    	validFromDraw
    validUntilDraw
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

export const LotteryGameQuota = gql`
  query LotteryGameQuota($id: String, $filterInput: LotteryGameQuotaFilterInput) {
    LotteryGameQuota(id: $id, filterInput: $filterInput) {
      _id
    	validFromDraw
    validUntilDraw
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

export const LotteryGameQuotaNumberList = gql`
  query LotteryGameQuotaNumberList($filterInput: LotteryGameQuotaNumberListInput, $page: Int, $count: Int) {
    LotteryGameQuotaNumberList(filterInput: $filterInput, page: $page, count: $count) {
      lotteryId
      gameId
      quotaId
      number
      series
    }
  }
`;

export const LotteryGameQuotaNumberListSize = gql`
  query LotteryGameQuotaNumberListSize($filterInput: LotteryGameQuotaNumberListInput!) {
    LotteryGameQuotaNumberListSize(filterInput: $filterInput)
  }
`;

export const CreateLotteryGameQuota = gql`
  mutation CreateLotteryGameQuota($input: LotteryGameQuotaInput!) {
    CreateLotteryGameQuota(input: $input) {
      code
   		 message
    }
  }
`;

export const UpdateLotteryGameQuota = gql`
  mutation UpdateLotteryGameQuota($id: ID!, $input: LotteryGameQuotaInput!) {
    UpdateLotteryGameQuota(id: $id, input: $input) {
      code
   		 message
    }
  }
`;

export const ApproveLotteryGameQuota = gql`
  mutation ApproveLotteryGameQuota($id: ID!, $approved: String, $approvedNotes: String) {
    ApproveLotteryGameQuota(id: $id, approved: $approved, approvedNotes: $approvedNotes) {
      code
   		 message
    }
  }
`;

export const RevokeLotteryGameQuota = gql`
  mutation RevokeLotteryGameQuota($id: ID!, $revoked: Boolean, $revokedNotes: String) {
    RevokeLotteryGameQuota(id: $id, revoked: $revoked, revokedNotes: $revokedNotes) {
      code
   		 message
    }
  }
`;
// QUOTA NUMBER
export const CreateLotteryGameQuotaNumber = gql`
  mutation CreateLotteryGameQuotaNumber($input: [LotteryGameQuotaNumberInput], $lotteryId: String, $gameId: String, $quotaId: String) {
    CreateLotteryGameQuotaNumber(input: $input, lotteryId: $lotteryId, gameId: $gameId, quotaId: $quotaId) {
      code
   		 message
    }
  }
`;

export const RemoveLotteryGameQuotaNumber = gql`
  mutation RemoveLotteryGameQuotaNumber($quotaId: String!) {
    RemoveLotteryGameQuotaNumber(quotaId: $quotaId) {
      code
   		 message
    }
  }
`;

export const LotteryGameQuotaUpdatedSubscription = gql`
  subscription{
    LotteryGameQuotaUpdatedSubscription{
      _id
    	validFromDraw
    validUntilDraw
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

export const LotteryGameQuotaNumberUpdatedSubscription = gql`
  subscription{
    LotteryGameQuotaNumberUpdatedSubscription{
      completed
      action
    }
  }
`;
