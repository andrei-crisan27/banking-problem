import { AccountsRepository } from '../repository/accounts.repository';
import { AccountType } from '../domain/account-type.enum';
import { SavingsAccountModel } from '../domain/savings-account.model';
import dayjs from 'dayjs';
import { CapitalizationFrequency } from '../domain/capitalization-frequency.enum';

export class SavingsManagerService {
  private systemDate = dayjs().toDate();
  public passTime(): void {
    const savingAccounts = AccountsRepository.getAll().filter(
      account => account.accountType === AccountType.SAVINGS
    ) as SavingsAccountModel[];

    const nextSystemDate = dayjs(this.systemDate).add(1, 'months');

    savingAccounts.forEach(savingAccount => {
      if (savingAccount.interestFrequency === CapitalizationFrequency.MONTHLY) {
        this.addInterestOnFrequency(savingAccount, nextSystemDate, 1);
      } else if (savingAccount.interestFrequency === CapitalizationFrequency.QUARTERLY){
        // quarterly interest frequency means 3 month growth
        this.addInterestOnFrequency(savingAccount, nextSystemDate, 3);
      }
    });

    this.systemDate = nextSystemDate.toDate();
  }

  // previous addMonthlyInterest function is now called addInterestOnFrequency
  // it has an extra parameter, monthGrowth, which is the frequency in months at which interest is added
  private addInterestOnFrequency(savingAccount: SavingsAccountModel, currentInterestMonth: dayjs.Dayjs, monthGrowth: number): void {
    const nextInterestDateForAccount = dayjs(savingAccount.lastInterestAppliedDate).add(monthGrowth, 'months');

    const sameMonth = currentInterestMonth.isSame(nextInterestDateForAccount, 'month');
    const sameYear = currentInterestMonth.isSame(nextInterestDateForAccount, 'year');

    if (sameMonth && sameYear) {
      this.addInterest(savingAccount);
      savingAccount.lastInterestAppliedDate = currentInterestMonth.toDate();
    }
  }

  private addInterest(savingAccount: SavingsAccountModel): void {
    savingAccount.balance.amount += savingAccount.balance.amount * savingAccount.interest; // update balance with interest
  }
}

export const SavingsManagerServiceInstance = new SavingsManagerService();
