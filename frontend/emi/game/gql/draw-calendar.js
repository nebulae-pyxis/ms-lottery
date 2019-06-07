import gql from "graphql-tag";

export const LotteryGameDrawCalendarList = gql`
  query LotteryGameDrawCalendarList($filterInput: LotteryGameDrawCalendarFilterInput!) {
    LotteryGameDrawCalendarList(filterInput: $filterInput) {
      _id
    	template {
        openDrawDaysBefore
        openDrawTime
        closeDrawMinutesBefore
        deactivateDrawMonthsAfter
        deactivateDrawtime
      }
      dateCalendar {
        openingDatetime
        closingDatetime
        drawingDatetime
        deactivationDatetime
        id
        drawState
      }
      validFromTimestamp
      validUntilTimestamp
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

export const LotteryGameDrawCalendar = gql`
  query LotteryGameDrawCalendar($id: String, $filterInput: LotteryGameDrawCalendarFilterInput) {
    LotteryGameDrawCalendar(id: $id, filterInput: $filterInput) {
      _id
      template {
        openDrawDaysBefore
        openDrawTime
        closeDrawMinutesBefore
        deactivateDrawMonthsAfter
        deactivateDrawtime
      }
      dateCalendar {
        openingDatetime
        closingDatetime
        drawingDatetime
        deactivationDatetime
        id
        drawState
      }
      validFromTimestamp
      validUntilTimestamp
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

export const CreateLotteryGameDrawCalendar = gql`
  mutation CreateLotteryGameDrawCalendar($input: LotteryGameDrawCalendarInput!) {
    CreateLotteryGameDrawCalendar(input: $input) {
      code
   		 message
    }
  }
`;

export const UpdateLotteryGameDrawCalendar = gql`
  mutation UpdateLotteryGameDrawCalendar($id: ID!, $input: LotteryGameDrawCalendarInput!) {
    UpdateLotteryGameDrawCalendar(id: $id, input: $input) {
      code
   		 message
    }
  }
`;

export const ApproveLotteryGameDrawCalendar = gql`
  mutation ApproveLotteryGameDrawCalendar($id: ID!, $approved: String, $approvedNotes: String) {
    ApproveLotteryGameDrawCalendar(id: $id, approved: $approved, approvedNotes: $approvedNotes) {
      code
   		 message
    }
  }
`;

export const RevokeLotteryGameDrawCalendar = gql`
  mutation RevokeLotteryGameDrawCalendar($id: ID!, $revoked: Boolean, $revokedNotes: String) {
    RevokeLotteryGameDrawCalendar(id: $id, revoked: $revoked, revokedNotes: $revokedNotes) {
      code
   		 message
    }
  }
`;

export const LotteryGameDrawCalendarUpdatedSubscription = gql`
  subscription($gameId: String){
    LotteryGameDrawCalendarUpdatedSubscription(gameId: $gameId){
      _id
    	template {
        openDrawDaysBefore
        openDrawTime
        closeDrawMinutesBefore
        deactivateDrawMonthsAfter
        deactivateDrawtime
      }
      dateCalendar {
        openingDatetime
        closingDatetime
        drawingDatetime
        deactivationDatetime
        id
        drawState
      }
      validFromTimestamp
      validUntilTimestamp
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
