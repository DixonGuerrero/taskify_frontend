import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#FFF1F2',
      100: '#FFDBDE',
      200: '#FFB8BC',
      300: '#FF9499',
      400: '#FF6C73',
      500: '#FC3942',
      600: '#E9333C',
      700: '#D62C35',
      800: '#C2252E',
      900: '#AF1E27',
      950: '#9C171F',
    },
    surface: {
      0: '#FFFFFF',
      50: '#F7F7F7',
      100: '#E0E0E0',
      200: '#C7C7C7',
      300: '#ADADAD',
      400: '#949494',
      500: '#4B4B4B',
      600: '#434343',
      700: '#3A3A3A',
      800: '#323232',
      900: '#292929',
      950: '#212121',
    },
    colorScheme: {
      light: {
        background: '#FFFFFF',
        primary: {
          color: '#FC3942',
          inverseColor: '#FFFFFF',
          hoverColor: '#D62C35',
          activeColor: '#C2252E',
        },
        highlight: {
          background: '#9C171F',
          focusBackground: '#D62C35',
          color: '#FFFFFF',
          focusColor: '#FFFFFF',
        },
        surface: {
          0: '#FFFFFF',
          50: '#F7F7F7',
          100: '#E0E0E0',
          200: '#C7C7C7',
          300: '#ADADAD',
          400: '#949494',
          500: '#4B4B4B',
          600: '#434343',
          700: '#3A3A3A',
          800: '#323232',
          900: '#292929',
          950: '#212121',
        },
      },
      dark: {
        primary: {
          color: '#FF6C73',
          inverseColor: '#212121',
          hoverColor: '#FF9499',
          activeColor: '#FFB8BC',
        },
        highlight: {
          background: 'rgba(252, 57, 66, 0.16)',
          focusBackground: 'rgba(252, 57, 66, 0.24)',
          color: 'rgba(255, 255, 255, 0.87)',
          focusColor: 'rgba(255, 255, 255, 0.87)',
        },
        surface: {
          0: '#212121',
          50: '#292929',
          100: '#323232',
          200: '#3A3A3A',
          300: '#434343',
          400: '#4B4B4B',
          500: '#949494',
          600: '#ADADAD',
          700: '#C7C7C7',
          800: '#E0E0E0',
          900: '#F7F7F7',
          950: '#FFFFFF',
        },
      },
    },
  },
  root: {
    fontFamily: 'Raleway, sans-serif',
  },
  components: {
    button: {
      colorScheme: {
        light: {},
        dark: {
          primary: {
            color: '#FFFFFF',
            inverseColor: '#212121',
            hoverColor: '#FFFFFF',
            activeColor: '#FFFFFF',
          },
        },
      },
      fontFamily: 'Varela Round, sans-serif',
      fontWeight: 'bolder',
      borderRadius: '10px',
    },
    dialog: {
      colorScheme: {
        light: {
          background: '#FFFFFF',
          color: '#000000',
        },
        dark: {
          background: '#121212',
          color: '#FFFFFF',
        },
      },
      border: {
        color: '#FC3942',
        radius: '10px',
      },
      header: {
        gap: '3rem',
      },
      content: {
        padding: '1rem',
      },
    },
    menu: {
      colorScheme: {
        light: {
          background: '#FFFFFF',
          color: '#000000',
          item: {
            color: '#000000',
            focus: {
              background: '#FC3942',
              color: '#FFFFFF',
            },
            icon: {
              focus: {
                color: '#FFFFFF',
              },
            },
          },
          border: {
            color: '#FFFFFF',
          },
        },
        dark: {
          background: '#121212',
          color: '#FFFFFF',
          item: {
            color: '#FFFFFF',
            focus: {
              background: '#FC3942',
              color: '#FFFFFF',
            },
            icon: {
              focus: {
                color: '#FFFFFF',
              },
            },
          },
          border: {
            color: '#121212',
          },
        },
      },

      border: {
        radius: '10px',
      },
    },
    toast: {
      colorScheme: {
        light: {
          success: {},
        },
        dark: {
          success: {
            detail: {
              color: '#FFFFFF',
            },
          },
          info: {
            detail: {
              color: '#FFFFFF',
            },
          },
          warn: {
            detail: {
              color: '#FFFFFF',
            },
          },
          error: {
            detail: {
              color: '#FFFFFF',
            },
          },
        },
      },
    },
    tag: {
      colorScheme: {
        light: {},
        dark: {
          info: {
            color: '#FFFFFF',
          },
        },
      },
    },
    datepicker: {
      colorScheme: {
        light: {
          light: {
            select: {
              month: {
                color: 'primary',
              },
              year: {
                color: 'primary',
              },
            },
            week: {
              day: {
                color: 'primary-200',
              },
            },
          },
        },
        dark: {
          panel: {
            background: '#121212',
            color: '#FC3942',
            border: {
              color: '#FC3942',
            },
          },
          header: {
            background: '#121212',
            color: '#FFFFFF',
          },
          date: {
            color: '#FFFFFF',
            border: {
              color: '#121212',
            },
          },
          select: {
            month: {
              color: '#FFFFFF',
            },
            year: {
              color: '#FFFFFF',
            },
          },
          week: {
            day: {
              color: 'primary-200',
            },
          },
        },
      },
    },
    confirmdialog: {
      colorScheme: {
        light: {
          background: '#FFFFFF',
          color: '#000000',
        },
        dark: {
          background: '#121212',
        },
      },
      icon: {
        color: '#FC3942',
      },
    },
    select: {
      colorScheme: {
        light: {
          background: '#FFFFFF',
          color: '#000000',
          border: {
            color: '#E0E0E0'
          },
          hover: {
            border: {
              color: '#FC3942'
            }
          },
          focus: {
            border: {
              color: '#FC3942'
            }
          },
          placeholder: {
            color: '#949494'
          },
          overlay: {
            background: '#FFFFFF',
            border: {
              color: '#E0E0E0'
            }
          },
          option: {
            color: '#000000',
            focus: {
              background: '#FFF1F2',
              color: '#FC3942'
            },
            selected: {
              background: '#FFDBDE',
              color: '#FC3942'
            }
          }
        },
        dark: {
          background: '#1A1616',
          color: '#FFFFFF',
          border: {
            color: 'rgba(252, 57, 66, 0.1)'
          },
          hover: {
            border: {
              color: '#FC3942'
            }
          },
          focus: {
            border: {
              color: '#FC3942'
            }
          },
          placeholder: {
            color: '#949494'
          },
          overlay: {
            background: '#121212',
            border: {
              color: 'rgba(252, 57, 66, 0.1)'
            },
            color: '#FFFFFF'
          },
          option: {
            color: '#FFFFFF',
            focus: {
              background: 'rgba(252, 57, 66, 0.16)',
              color: '#FFFFFF'
            },
            selected: {
              background: 'rgba(252, 57, 66, 0.24)',
              color: '#FFFFFF'
            }
          }
        }
      },
      border: {
        radius: '10px'
      },
      transition: {
        duration: '0.2s'
      },
      overlay: {
        shadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: {
          radius: '10px'
        }
      },
      option: {
        padding: '0.75rem 1rem',
        border: {
          radius: '6px'
        }
      }
    },
    progressspinner: {
      colorScheme: {
        light: {
          color: {
            1: '#FC3942',
            2: '#FC3942',
            3: '#FC3942',
            4: '#FC3942',
          }
        },
        dark: {
          color: {
            1: '#FC3942',
            2: '#FC3942',
            3: '#FC3942',
            4: '#FC3942',
          }
        },
      },
    },
    popover: {
      colorScheme: {
        light: {
          background: '#FFFFFF',
          color: '#000000',
          border: {
            color: '#E0E0E0'
          }
        },
        dark: {
          background: '#121212',
          color: '#FFFFFF',
          border: {
            color: '#121212'
          }
        }
      },
      content: {
        padding: '0'
      }
    }
  },
});

export default MyPreset;
