//Every single error code
// please use the prefix assigned to this micorservice
const INTERNAL_SERVER_ERROR_CODE = 00001;
const PERMISSION_DENIED = { code: 00002, description: 'Permission denied'};;
const GAME_SHEET_CONFIG_PENDIG_ERROR = { code: 10010, description: 'Game sheet config pending error'};

/**
 * class to emcapsulute diferent errors.
 */
class CustomError extends Error {
    constructor(name, method, code = INTERNAL_SERVER_ERROR_CODE , message = '') {
      super(message); 
      this.code = code;
      this.name = name;
      this.method = method;
    }
  
    getContent(){
      return {
        name: this.name,
        code: this.code,
        msg: this.message,      
        method: this.method,
        // stack: this.stack
      }
    }
  };

  class DefaultError extends Error{
    constructor(anyError){
      super(anyError.message)
      this.code = INTERNAL_SERVER_ERROR_CODE;
      this.name = anyError.name;
      this.msg = anyError.message;
      // this.stack = anyError.stack;
    }

    getContent(){
      return{
        code: this.code,
        name: this.name,
        msg: this.msg
      }
    }
  }

  module.exports =  { 
    CustomError,
    DefaultError,
    INTERNAL_SERVER_ERROR_CODE,
    PERMISSION_DENIED,
    GAME_SHEET_CONFIG_PENDIG_ERROR,
    MISSING_SHEET_TO_OPEN_DRAW: new CustomError('MissingSheetConfig', `searchConfigurationToOpenADraw`, 10120, 'Missing Sheet Config to Open the draw'),
    MISSING_PRIZE_PROGRAM_TO_OPEN_DRAW: new CustomError('MissingPrizeProgram', `searchConfigurationToOpenADraw`, 10121, 'Missing Prize Program to Open the draw'),
    MISSING_QUOTA_CONFIG_TO_OPEN_DRAW: new CustomError('MissingQuotaConfig', `searchConfigurationToOpenADraw`, 10122, 'Missing Quota Config to Open the draw'),
  } 