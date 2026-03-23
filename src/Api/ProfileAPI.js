import {baseURL} from './apiUtility';

/**
 * Fetch user profile data including profile image URL.
 * API response shape: { Image, Email, MobileNo, Post, Office, name, userId, success }
 *
 * @param {{ userId: string, office: string }} credentials
 * @returns {Promise<object|null>}
 */
export async function GetUserProfileApi(credentials) {
  console.log('GetUserProfileApi called with:', credentials);
  if (
    !credentials ||
    !credentials.userId ||
    credentials.userId === 'null' ||
    credentials.userId === 'undefined'
  ) {
    console.warn('GetUserProfileApi called without a valid userId');
    return null;
  }
  if (
    !credentials.office ||
    credentials.office === 'null' ||
    credentials.office === 'undefined'
  ) {
    console.warn('GetUserProfileApi called without a valid office value');
    return null;
  }
  try {
    const response = await fetch(baseURL + 'user/profile', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId: credentials.userId,
        office: credentials.office,
      }),
    });
    const result = await response.json();
    console.log('GetUserProfileApi result:', result);
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.message || 'Unknown error'}`,
      );
    }
    return result;
  } catch (error) {
    console.error('GetUserProfileApi Fetch Error:', error.message);
    return null;
  }
}

/**
 * Helper — extract the profile image URL from whatever shape
 * GetUserProfileApi returns.
 * Current shape: { Image: 'https://...', success: true, ... }
 *
 * @param {object|null} profileResult
 * @returns {string|null}
 */
export function extractProfileImage(profileResult) {
  if (!profileResult) return null;
  return (
    profileResult.Image ||          // ✅ actual key returned by API
    profileResult.image ||
    profileResult.imageURL ||
    profileResult.profileImage ||
    profileResult.data?.Image ||
    profileResult.data?.imageURL ||
    profileResult.data?.profileImage ||
    null
  );
}

/**
 * Update profile image for a user.
 * Sends userId, office, and Cloudinary imageURL to the backend.
 *
 * @param {{ userId: string, office: string, imageURL: string }} credentials
 * @returns {Promise<object|null>}
 */
export async function UpdateProfileImageApi(credentials) {
  console.log('UpdateProfileImageApi', credentials);
  if (
    !credentials ||
    !credentials.userId ||
    credentials.userId === 'null' ||
    credentials.userId === 'undefined'
  ) {
    console.warn('UpdateProfileImageApi called without a valid userId');
    return null;
  }
  if (
    !credentials.office ||
    credentials.office === 'null' ||
    credentials.office === 'undefined'
  ) {
    console.warn('UpdateProfileImageApi called without a valid office value');
    return null;
  }
  if (!credentials.imageURL) {
    console.warn('UpdateProfileImageApi called without imageURL');
    return null;
  }
  try {
    const response = await fetch(baseURL + 'user/updateProfileImage', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        userId: credentials.userId,
        office: credentials.office,
        imageURL: credentials.imageURL,
      }),
    });
    const result = await response.json();
    console.log('UpdateProfileImageApi result:', result);
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.message || 'Unknown error'}`,
      );
    }
    return result;
  } catch (error) {
    console.error('UpdateProfileImageApi Fetch Error:', error.message);
    return null;
  }
}