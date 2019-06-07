import gql from "graphql-tag";

export const LotteryGamePrizeProgramList = gql`
  query LotteryGamePrizeProgramList($filterInput: LotteryGamePrizeProgramFilterInput!) {
    LotteryGamePrizeProgramList(filterInput: $filterInput) {
    _id
    prizeClaimThreshold
    validFromDraw
    validUntilDraw
    grandPrize {
      total
      payment
    }
    twoOutOfThree {
      name
      duoTotal
      duoPayment
      singleTotal
      singlePayment
    }
    secondaryPrices {
      id
      name
      quantity
      withSerie
      total
      payment
    }
    approximations {
      order
      name
      approximationTo
      approximationsTolds
      numberMaskType
      numberMaskRegex
      seriesMaskType
      total
      payment
    }
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

export const LotteryGamePrizeProgram = gql`
  query LotteryGamePrizeProgram($id: String, $filterInput: LotteryGamePrizeProgramFilterInput) {
    LotteryGamePrizeProgram(id: $id, filterInput: $filterInput) {
    _id
    prizeClaimThreshold
    validFromDraw
    validUntilDraw
    grandPrize {
      total
      payment
    }
    twoOutOfThree {
      name
      duoTotal
      duoPayment
      singleTotal
      singlePayment
    }
    secondaryPrices {
      id
      name
      quantity
      withSerie
      total
      payment
    }
    approximations {
      order
      name
      approximationTo
      approximationsTolds
      numberMaskType
      numberMaskRegex
      seriesMaskType
      total
      payment
    }
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

export const CreateLotteryGamePrizeProgram = gql`
  mutation CreateLotteryGamePrizeProgram($input: LotteryGamePrizeProgramInput!) {
    CreateLotteryGamePrizeProgram(input: $input) {
      code
   		 message
    }
  }
`;

export const UpdateLotteryGamePrizeProgram = gql`
  mutation UpdateLotteryGamePrizeProgram($id: ID!, $input: LotteryGamePrizeProgramInput!) {
    UpdateLotteryGamePrizeProgram(id: $id, input: $input) {
      code
   		 message
    }
  }
`;

export const ApproveLotteryGamePrizeProgram = gql`
  mutation ApproveLotteryGamePrizeProgram($id: ID!, $approved: String, $approvedNotes: String) {
    ApproveLotteryGamePrizeProgram(id: $id, approved: $approved, approvedNotes: $approvedNotes) {
      code
   		 message
    }
  }
`;

export const RevokeLotteryGamePrizeProgram = gql`
  mutation RevokeLotteryGamePrizeProgram($id: ID!, $revoked: Boolean, $revokedNotes: String) {
    RevokeLotteryGamePrizeProgram(id: $id, revoked: $revoked, revokedNotes: $revokedNotes) {
      code
   		 message
    }
  }
`;

// SUBSCRIPTION
export const LotteryGamePrizeProgramUpdatedSubscription = gql`
  subscription($gameId: String){
    LotteryGamePrizeProgramUpdatedSubscription(gameId: $gameId){
    _id
    prizeClaimThreshold
    validFromDraw
    validUntilDraw
    grandPrize {
      total
      payment
    }
    twoOutOfThree {
      name
      duoTotal
      duoPayment
      singleTotal
      singlePayment
    }
    secondaryPrices {
      id
      name
      quantity
      withSerie
      total
      payment
    }
    approximations {
      order
      name
      approximationTo
      approximationsTolds
      numberMaskType
      numberMaskRegex
      seriesMaskType
      total
      payment
    }
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
