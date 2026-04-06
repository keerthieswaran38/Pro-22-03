import mongoose, { Document, Schema } from 'mongoose';

export interface IWinner {
  name: string;
  time: string;
}

export interface ILeaderboard extends Document {
  eventSlug: string;
  winners: IWinner[];
  expireAt?: Date;
}

const leaderboardSchema = new Schema<ILeaderboard>({
  eventSlug: { type: String, required: true, unique: true, index: true },
  winners: [
    {
      name: { type: String, required: true },
      time: { type: String, required: true }
    }
  ],
  expireAt: { type: Date, expires: 0 } // Auto-deletes when date is reached
});

export default mongoose.model<ILeaderboard>('Leaderboard', leaderboardSchema);
