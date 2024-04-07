import { TransactionModel } from '../domain/transaction.model';
import { MoneyModel } from '../domain/money.model';
import { AccountsRepository } from '../repository/accounts.repository';
import dayjs from 'dayjs';
import { AccountType } from '../domain/account-type.enum';
import { AccountModel } from '../domain/account.model';
import { CurrencyType } from '../domain/currency-type.enum';

export class TransactionManagerService {
  public transfer(fromAccountId: string, toAccountId: string, value: MoneyModel): TransactionModel {
    const fromAccount = AccountsRepository.get(fromAccountId);
    const toAccount = AccountsRepository.get(toAccountId);
    const crypto = require('crypto');

    if (!fromAccount || !toAccount) {
      throw new Error('Specified account does not exist');
    }

    // Precondition 1: money can't be transfered
    // from a savings account to a different account
    if(fromAccount.accountType === AccountType.SAVINGS){
      throw new Error("You can't transfer money from a savings account!");
    }

    //Precondition 3: result of a transaction
    // can't lead to a negative account balance
    if(!this.checkNegativeTransaction(fromAccount, value)){
      throw new Error("The result of a transaction can't lead to negative balance!");
    }

    const transaction = new TransactionModel({
      id: crypto.randomUUID(),
      from: fromAccountId,
      to: toAccountId,
      amount: value,
      timestamp: dayjs().toDate(),
    });
    
    // use negative amount as money are subtracted from the account
    this.computeTransaction(fromAccount, -value.amount, value.currency);
    fromAccount.transactions = [...fromAccount.transactions, transaction];
    
    this.computeTransaction(toAccount, value.amount, value.currency);
    toAccount.transactions = [...toAccount.transactions, transaction];

    return transaction;
  }

  // function to convert RON to EUR
  public convertRonToEur(amount: number): number{
    return amount / 5;
  }

  //function to convert EUR to RON
  public convertEurToRon(amount: number): number{
    return amount * 5;
  }

  // function to check if a transaction will lead
  // to an account with a negative amount of money
  public checkNegativeTransaction(fromAccount: AccountModel, value: MoneyModel): boolean{
    if(fromAccount.balance.currency != value.currency){
      if(fromAccount.balance.currency === CurrencyType.EUR){
        const valueAmountToEur = this.convertRonToEur(value.amount);
        return fromAccount.balance.amount - valueAmountToEur >= 0;
      } else {
        const valueAmountToRon = this.convertEurToRon(value.amount);
        return fromAccount.balance.amount - valueAmountToRon >= 0;
      }
    }
    return fromAccount.balance.amount - value.amount >= 0;
  }

  // function that computes a transaction by
  // moving money in or out of a specific account
  public computeTransaction(account: AccountModel, valueAmount: number, valueCurrency: CurrencyType): void{
    if(account.balance.currency != valueCurrency){
      if(account.balance.currency === CurrencyType.EUR)
        account.balance.amount += this.convertRonToEur(valueAmount);
      else
        account.balance.amount += this.convertEurToRon(valueAmount);
    } else {
      account.balance.amount += valueAmount;
    }
  }

  // withdraw function implementation: does validations for
  // account and transaction amount values, and then computes the transaction
  public withdraw(accountId: string, amount: MoneyModel): TransactionModel {
    const targetAccount = AccountsRepository.get(accountId);
    const crypto = require('crypto');

    if (!targetAccount) {
      throw new Error('Specified account does not exist');
    }

    if(!this.checkNegativeTransaction(targetAccount, amount)){
      throw new Error("You don't have enough money to withdraw!");
    }

    const transaction = new TransactionModel({
      id: crypto.randomUUID(),
      from: accountId,
      to: accountId,
      amount: amount,
      timestamp: dayjs().toDate(),
    });

    // use negative amount as money are subtracted from the account
    this.computeTransaction(targetAccount, - amount.amount, amount.currency);
    targetAccount.transactions = [...targetAccount.transactions, transaction];
    
    return transaction;
  }

  public checkFunds(accountId: string): MoneyModel {
    if (!AccountsRepository.exist(accountId)) {
      throw new Error('Specified account does not exist');
    }
    return AccountsRepository.get(accountId)!.balance;
  }

  public retrieveTransactions(accountId: string): TransactionModel[] {
    if (!AccountsRepository.exist(accountId)) {
      throw new Error('Specified account does not exist');
    }
    return AccountsRepository.get(accountId)!.transactions;
  }
}

export const TransactionManagerServiceInstance = new TransactionManagerService();
