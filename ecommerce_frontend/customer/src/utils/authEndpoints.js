/** Auth API paths — customer vs seller (admin is separate). */
export const AUTH_LOGIN = '/auth/login';
export const AUTH_CUSTOMER_REGISTER = '/auth/customer/register';
export const AUTH_SELLER_REGISTER = '/auth/seller/register';

export function getRegisterEndpoint({ seller = false } = {}) {
  return seller ? AUTH_SELLER_REGISTER : AUTH_CUSTOMER_REGISTER;
}
