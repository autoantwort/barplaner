<template>
  <BNavbar class="d-print-none" toggleable="lg" style="background-color: var(--bs-tertiary-bg);">
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <ul class="navbar-nav mx-auto">
        <li v-if="barAdmin" class="nav-item">
          <router-link class="nav-link" to="/addBar">Add Bar</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/bars">All bars</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/users">Users</router-link>
        </li>
        <li v-if="userAdmin" class="nav-item">
          <router-link class="nav-link" to="/roles">Roles</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/duty">Putzen</router-link>
        </li>
        <li class="nav-item" v-if="cleaningAdmin">
          <router-link class="nav-link" to="/settings">Settings</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/remoteVolumeControl">Volume</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/remoteControlPane">Control Pane</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/addStockChange">Add Stock Change</router-link>
        </li>
        <b-nav-item-dropdown text="Lager" right>
          <b-dropdown-item to="/addItem">Add Item</b-dropdown-item>
          <b-dropdown-item to="/addPosition">Add Position</b-dropdown-item>
          <b-dropdown-item to="/addItemGroup">Add ItemGroup</b-dropdown-item>
          <b-dropdown-item to="/addStockChange">Add Change</b-dropdown-item>
          <div class="dropdown-divider"></div>
          <b-dropdown-item to="/itemStock">Items</b-dropdown-item>
          <b-dropdown-item to="/positions">Positions</b-dropdown-item>
          <b-dropdown-item to="/itemGroups">Item groups</b-dropdown-item>
          <div class="dropdown-divider"></div>
          <b-dropdown-item to="/itemGroupStock">Shopping list</b-dropdown-item>
          <b-dropdown-item to="/stockChanges">Stock changes</b-dropdown-item>
          <div class="dropdown-divider"></div>
          <b-dropdown-item to="/addInvoice">Add invoice</b-dropdown-item>
          <b-dropdown-item to="/invoices">Invoices</b-dropdown-item>
          <div class="dropdown-divider"></div>
          <b-dropdown-item to="/scannedItem">Scanned Item Page</b-dropdown-item>
          <b-dropdown-item to="/itemRequests">Item Requests</b-dropdown-item>
        </b-nav-item-dropdown>
        <li class="nav-item">
          <router-link class="nav-link" to="/account">Account</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/logout">Logout</router-link>
        </li>
        <BNavItemDropdown>
          <template #button-content>
            <component :is="map[colorMode]" hight="1.1em" :aria-label="`Toggle theme (${colorMode})`" class="d-inline-block" />
          </template>
          <BDropdownItem v-for="el in Object.keys(map)" :key="el" :active="colorMode === el" @click="colorMode = el">
            <component :is="map[el]" /> {{ el }}
          </BDropdownItem>
        </BNavItemDropdown>
      </ul>
    </BCollapse>
  </BNavbar>
  <router-view></router-view>
</template>

<script>
import Roles from '@/roles';
import MoonStarsFill from '~icons/bi/moon-stars-fill'
import SunFill from '~icons/bi/sun-fill'
import CircleHalf from '~icons/bi/circle-half'
import { useColorMode } from 'bootstrap-vue-next'


export default {
  name: 'app',
  data() {
    return {
      cleaningAdmin: false,
      userAdmin: false,
      barAdmin: false,
      map: {
        dark: MoonStarsFill,
        light: SunFill,
        auto: CircleHalf,
      },
    };
  },
  mounted() {
    this.cleaningAdmin = Roles.haveRole('CleaningAdmin');
    this.userAdmin = Roles.haveRole('UserAdmin');
    this.barAdmin = Roles.haveRole('BarAdmin');
  },
  setup() {
    const colorMode = useColorMode({ persist: true, emitAuto: true });
    return { colorMode };
  },
};
</script>

<style></style>
