export default {
    mixins: [baseMixin],
    data() {
        return {
            Deposit: 1000000,
            DepositPerMonth: 0,
            AnnualRatePerYear: 4.2,
            Month: 1,
            Year: 0,
        }
    },
    created() {

    },
    computed: {
        CalculateMonth() {
            return this.Month + this.Year * 12
        },
        Accumulation() {
            let result = this.Deposit;

            for (let i = 0; i < this.CalculateMonth; i++) {
                result += result * (this.AnnualRatePerYear / 12) / 100 + this.DepositPerMonth;
            }
            return result
        },
        Interest() {
            return this.Accumulation - this.Deposit - (this.DepositPerMonth * this.CalculateMonth);
        },
        CompoundInterest() {
            let result = this.Deposit;

            for (let i = 0; i < this.CalculateMonth; i++) {
                result += this.Deposit * (this.AnnualRatePerYear / 12) / 100 + this.DepositPerMonth;
            }
            return this.Accumulation - result
        },
        CompoundRate() {
            return this.CompoundInterest / this.Interest * 100;
        },
    },
    methods: {

    },
}