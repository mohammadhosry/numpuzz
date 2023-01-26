<script>
const randomInt = (max = 9, min = 1) => Math.floor(Math.random() * max) + 1;

export default {
  data() {
    return {
      x: 4,
      y: 4,
      table: [],
      rowsAns: [],
      colsAns: [],
    };
  },
  methods: {
    reset() {
      this.table = Array(this.y);

      for (let i = 0; i < this.y; i++) {
        this.table[i] = Array(this.x);

        for (let j = 0; j < this.x; j++) {
          this.table[i][j] = {
            num: randomInt(),
            selected: false,
            ans: randomInt(this.x) > this.x / 2,
          };
        }

        if (this.table[i].every((a) => !a.ans)) {
          this.table[i][randomInt(this.x - 1, 0)].ans = true;
        }
      }

      for (let i = 0; i < this.x; i++) {
        let flag = false;

        for (let j = 0; j < this.y; j++) {
          flag ||= this.table[j][i].ans;
        }

        if (!flag) {
          this.table[randomInt(this.y - 1, 0)][i].ans = true;
        }
      }

      this.rowsAns = this.calcRowsSum("ans");
      this.colsAns = this.calcColsSum("ans");
    },
    calcRowsSum(key = "selected") {
      return this.table.map((row) =>
        row.reduce((a, b) => (a += b?.[key] && b?.num), 0)
      );
    },
    calcColsSum(key = "selected") {
      return this.table.reduce((r, a) => {
        a.forEach((b, i) => {
          r[i] ||= 0;
          r[i] += +b?.[key] && b.num;
        });
        return r;
      }, []);
    },
  },
  computed: {
    won() {
      return (
        this.rowsSum.join("") == this.rowsAns.join("") &&
        this.colsSum.join("") == this.colsAns.join("")
      );
    },
    rowsSum() {
      return this.calcRowsSum();
    },
    colsSum() {
      return this.calcColsSum();
    },
    // rowsAns() {
    //   return this.calcRowsSum("ans");
    // },
    // colsAns() {
    //   return this.calcColsSum("ans");
    // },
  },
  created() {
    this.reset();
  },
  watch: {
    won(val) {
      if (val) {
        this.$confetti.start();
      } else {
        this.$confetti.stop();
      }
    },
  },
};
</script>

<style>
td {
    text-align: center;
    cursor: pointer;
}

.selected {
    background-color: #9bc362;
    color: #000000;
}

/* .done {
     background-color: gold;
     color: #000000;
     font-weight: bold;
} */
</style>

<template>
  <div class="grid">
    <select v-model="x">
      <option :value="3">3</option>
      <option :value="4">4</option>
      <option :value="5">5</option>
      <option :value="6">6</option>
    </select>
    X
    <select v-model="y">
      <option :value="3">3</option>
      <option :value="4">4</option>
      <option :value="5">5</option>
      <option :value="6">6</option>
    </select>
    <button @click="reset">reset</button>
  </div>
  <br /><br /><br />
  <table>
    <tr v-for="(row, i) in table">
      <td
        v-for="(cell, j) in row"
        :class="{ selected: cell.selected }"
        @click="table[i][j].selected = !cell.selected"
      >
        {{ cell.num }}
      </td>
      <td :class="{ done: rowsAns[i] == rowsSum[i] }">
        {{ rowsAns[i] }} ({{ rowsSum[i] }})
      </td>
    </tr>
    <tr>
      <td v-for="(num, i) in colsAns" :class="{ done: num == colsSum[i] }">
        {{ num }} ({{ colsSum[i] }})
      </td>
    </tr>
  </table>
</template>
