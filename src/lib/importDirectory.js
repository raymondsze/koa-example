import _ from 'lodash';
import requireDirectory from 'require-directory';

function preVisit(obj) {
  // hacking, the babel will add __esModule to indicate es7 module
  return obj && obj.__esModule ? obj.default : obj;
}

// This function can be used as usual as require-directory
export default (...args) => {
  // find the argument that is option
  const _args = args;
  let index = 1;
  let options = {};
  if (args.length === 3) {
    index = 2;
    options = args[index];
  } else if (args.length === 2) {
    options = args[1];
  }
  _args.length = (args.length < 2) ? 2 : args.length;
  _args[index] = options;


	// markdown the optins.visit, and aop it with preVisit
  const visit = options.visit;
  options.visit = (obj) => {
    const result = preVisit(obj);
    return _.isFunction(visit) ? visit(result) : result;
  };

	// apply the function
  return requireDirectory.apply(null, _args);
};
