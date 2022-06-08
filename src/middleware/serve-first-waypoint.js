import { validateUrlPath } from '../lib/utils.js';

/**
 * @access private
 * @typedef {import('express').RequestHandler} ExpressRequestHandler
 */

/**
 * @access private
 * @typedef {import('../casa').Plan} Plan
 */

/**
 * Redirect the user to the first Plan waypoint when they request the root /
 * path.
 *
 * @param {Plan} plan CASA Plan
 * @returns {ExpressRequestHandler[]} Array of middleware
 */
export default ({
  plan,
}) => [(req, res) => {
  const reqUrl = new URL(req.url, 'https://placeholder.test/');
  const reqPath = validateUrlPath(`${req.baseUrl}${reqUrl.pathname}${plan.getWaypoints()[0]}`);
  let reqParams = reqUrl.searchParams.toString();
  reqParams = reqParams ? `?${reqParams}` : '';
  res.redirect(302, `${reqPath}${reqParams}`);
}];
