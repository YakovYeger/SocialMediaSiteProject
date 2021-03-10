import DataLoader from "dataloader";
import { Upvoot } from "../entites/Upvoot";

//pass in {postId, userId, value} as keys and return Upvoot
export const createUpvootLoader = () =>
	new DataLoader<{ postId: number; userId: number }, Upvoot | null>(
		async (keys) => {
			const upvoots = await Upvoot.findByIds(keys as any);
			const upvootIdsToUpvoot: Record<string, Upvoot> = {};
			upvoots.forEach((upvoot) => {
				upvootIdsToUpvoot[`${upvoot.userId}|${upvoot.postId}`] = upvoot;
			});
			return keys.map(
				(key) => upvootIdsToUpvoot[`${key.userId}|${key.postId}`]
			); //array of users
		}
	);
